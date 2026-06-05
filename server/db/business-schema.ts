/**
 * Schéma métier Cauris (Phase 3) — porté des données de `design/wireframe/wf-lib.jsx`.
 *
 * Conventions (CLAUDE.md) :
 *  - **Scoping applicatif** : chaque table porte `user_id` (FK user, cascade) + index.
 *  - **Montants en entiers FCFA** (jamais de float). Un taux d'intérêt n'est pas un
 *    montant → stocké en points de base entiers (`rate_bps`, 950 = 9,5 %).
 *  - **Dates en texte ISO** : jour `YYYY-MM-DD`, mois `YYYY-MM`.
 *  - Idiome identique à `auth-schema.ts` (sqliteTable, modes integer, timestamps).
 *
 * `monthly_summaries` et `category_summaries` : depuis la bascule de la façade
 * (chantier dérivation), les agrégats du **mois courant** sont **dérivés** de
 * `SUM(transactions)` — la façade `getMonthlySummary` / `getCategoryBreakdown`
 * somme le ledger pour `DERIVED_MONTH` et lit ces tables pour les mois PASSÉS
 * (historique du trend). La ligne `monthly_summaries` du mois courant ne garde
 * que `balance_delta_pct` (totaux NULL) ; ses `category_summaries` n'existent plus.
 * Aucun écran ne requête ces tables directement (seule la façade le fait).
 */
import { randomUUID } from 'node:crypto'
import { relations, sql } from 'drizzle-orm'
import { sqliteTable, text, integer, index, unique } from 'drizzle-orm/sqlite-core'
import { user } from './auth-schema'

/** PK texte générée comme côté auth (id opaque). */
const pk = () => text('id').primaryKey().$defaultFn(() => randomUUID())

/** FK vers le user authentifié — présente sur toute table (scoping applicatif). */
const userId = () =>
  text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })

/** Timestamps `timestamp_ms` (mêmes défauts que l'auth). Factory → builders neufs. */
const timestamps = () => ({
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

/* ───────────────────────────── Comptes ───────────────────────────── */
export const accounts = sqliteTable(
  'accounts',
  {
    id: pk(),
    userId: userId(),
    name: text('name').notNull(),
    bank: text('bank').notNull(),
    type: text('type').notNull(),
    accountNumber: text('account_number').notNull(),
    // Modèle B — SOLDE INITIAL (point de départ), PAS le solde courant. Le solde
    // courant affiché est DÉRIVÉ : `balance + Σ(mouvements du compte)` via
    // `computeAccountBalances` (queries.ts). Ne JAMAIS lire `balance` comme un solde
    // courant. (Peut être négatif : c'est un point de calcul, jamais affiché tel quel.)
    balance: integer('balance').notNull(),
    blocked: integer('blocked', { mode: 'boolean' }).default(false).notNull(),
    // Compte CLÔTURÉ (réversible) : sort des listes ET du patrimoine (≠ blocked, qui
    // reste compté + masqué). Le solde dérivé reste calculable (détail/désarchivage).
    archived: integer('archived', { mode: 'boolean' }).default(false).notNull(),
    sort: integer('sort').default(0).notNull(),
    ...timestamps(),
  },
  (t) => [index('accounts_user_idx').on(t.userId)],
)

/* ─────────────────────────── Catégories ──────────────────────────── */
export const categories = sqliteTable(
  'categories',
  {
    id: pk(),
    userId: userId(),
    name: text('name').notNull(),
    // 'expense' | 'income' | 'transfer'
    kind: text('kind').notNull(),
    // slot de palette résolu dans tokens.css : 'cat-1'…'cat-6' (jamais un hex)
    colorToken: text('color_token'),
    sort: integer('sort').default(0).notNull(),
    ...timestamps(),
  },
  (t) => [index('categories_user_idx').on(t.userId)],
)

/* ────────────────────────── Transactions ─────────────────────────── */
export const transactions = sqliteTable(
  'transactions',
  {
    id: pk(),
    userId: userId(),
    // RESTRICT : un compte référencé par une opération ne peut PAS être supprimé au
    // niveau DB (filet derrière le garde 409 applicatif) — jamais détruire l'historique.
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
    // destination d'un transfert (« → Épargne ») — sinon null
    transferAccountId: text('transfer_account_id').references(() => accounts.id, {
      onDelete: 'set null',
    }),
    label: text('label').notNull(),
    // note libre optionnelle (≠ label : le label est le nom affiché en liste)
    note: text('note'),
    // entier FCFA signé : négatif = sortie, positif = entrée
    amount: integer('amount').notNull(),
    occurredAt: text('occurred_at').notNull(), // YYYY-MM-DD
    // 'Dépense' | 'Revenu' | 'Transfert' | 'Récurrente'
    type: text('type').notNull(),
    // Canal de paiement ∈ liste FERMÉE { wave, orange_money, cash, banque } (Lot B1).
    // NULL = Transfert (mouvement interne, pas de canal) ou ligne legacy. Validé serveur
    // (rejet du fantôme) ; non affiché au repos (pas de ventilation analytics en B1).
    channel: text('channel'),
    ...timestamps(),
  },
  (t) => [
    index('transactions_user_idx').on(t.userId),
    index('transactions_account_idx').on(t.accountId),
    index('transactions_category_idx').on(t.categoryId),
  ],
)

/* ──────────────────────────── Budgets ────────────────────────────── */
export const budgets = sqliteTable(
  'budgets',
  {
    id: pk(),
    userId: userId(),
    // RESTRICT (et non CASCADE) : supprimer une catégorie référencée par un budget est
    // INTERDIT au niveau DB (défense en profondeur derrière le garde 409 applicatif) —
    // jamais détruire un budget en silence via la suppression d'une catégorie.
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    cap: integer('cap').notNull(),
    // `spent` = enveloppe STOCKÉE (≠ dépense de catégorie dérivée du ledger ; distinction
    // Phase 6 à préserver). RÈGLE : budgets SEEDÉS gardent leur enveloppe d'origine ;
    // budgets NEUFS (POST) démarrent à `spent` = dépenses catégorie dérivées À LA CRÉATION
    // (cf. createBudget) — pas 0. Stocké dans les deux cas (jamais re-dérivé à la volée).
    spent: integer('spent').default(0).notNull(),
    txnCount: integer('txn_count').default(0).notNull(),
    period: text('period').notNull(), // YYYY-MM : mois d'application du budget
    // Réglages du formulaire « Nouveau budget » (wireframe) :
    frequency: text('frequency').notNull().default('Mensuel'), // 'Hebdo' | 'Mensuel' | 'Annuel'
    alertPct: integer('alert_pct').notNull().default(90), // seuil d'alerte : 80 | 90 | 100
    rollover: integer('rollover', { mode: 'boolean' }).notNull().default(false), // reporter le non-dépensé
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false), // onglet « Archivés »
    ...timestamps(),
  },
  (t) => [index('budgets_user_idx').on(t.userId)],
)

/* ──────────────────────────── Objectifs ──────────────────────────── */
export const goals = sqliteTable(
  'goals',
  {
    id: pk(),
    userId: userId(),
    name: text('name').notNull(),
    targetAmount: integer('target_amount').notNull(),
    currentAmount: integer('current_amount').default(0).notNull(),
    // Dette onboarding (Phase 2 → écran Objectifs Phase 7) : saisie réelle à venir.
    targetDate: text('target_date'), // YYYY-MM-DD | null
    // Sortie de cycle de vie : un objectif contribué s'ARCHIVE (réversible, disparaît
    // de la liste — pas de vue archivés dédiée côté objectifs). La suppression dure
    // est réservée aux objectifs SANS contribution (préserve l'historique).
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    ...timestamps(),
  },
  (t) => [index('goals_user_idx').on(t.userId)],
)

/* ──────────────────────── Versements (goals) ─────────────────────── */
export const contributions = sqliteTable(
  'contributions',
  {
    id: pk(),
    userId: userId(),
    goalId: text('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),
    accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
    amount: integer('amount').notNull(),
    occurredAt: text('occurred_at').notNull(), // YYYY-MM-DD
    ...timestamps(),
  },
  (t) => [
    index('contributions_user_idx').on(t.userId),
    index('contributions_goal_idx').on(t.goalId),
  ],
)

/* ──────────────────── Enveloppes cash (Lot B4) ───────────────────── */
// Suivi « allégé » d'un compte espèces : un PLAFOND périodique + une réconciliation
// (l'utilisateur déclare le reste → l'app enregistre la dépense agrégée au ledger).
// `spent`/`left` ne sont PAS stockés : DÉRIVÉS (Modèle B) — `left` = solde dérivé du
// compte, `spent` = cap − left. 1 enveloppe par compte (unique account_id).
export const envelopes = sqliteTable(
  'envelopes',
  {
    id: pk(),
    userId: userId(),
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    cap: integer('cap').notNull(), // plafond périodique (entier FCFA)
    period: text('period').notNull(), // YYYY-MM
    lastReconciledAt: text('last_reconciled_at'), // YYYY-MM-DD | null
    ...timestamps(),
  },
  (t) => [
    index('envelopes_user_idx').on(t.userId),
    unique('envelopes_account_uq').on(t.accountId),
  ],
)

/* ────────────────────────────── Prêts ────────────────────────────── */
export const loans = sqliteTable(
  'loans',
  {
    id: pk(),
    userId: userId(),
    name: text('name').notNull(),
    principal: integer('principal').notNull(),
    remaining: integer('remaining').notNull(),
    // taux en points de base (entier) : 950 = 9,5 %. Pas de float pour un taux.
    rateBps: integer('rate_bps').notNull(),
    monthlyPayment: integer('monthly_payment').notNull(),
    termMonths: integer('term_months').notNull(),
    monthsRemaining: integer('months_remaining').notNull(),
    nextDueDate: text('next_due_date'), // YYYY-MM-DD | null
    // Type/libellé (auto, immobilier, conso…). Vide pour les prêts legacy.
    kind: text('kind').default('').notNull(),
    // Mode « tout-compris » (SGCI) — défauts 0 = prêt simple (amortissement classique, ex. Aïcha).
    taxBps: integer('tax_bps').default(0).notNull(), // taxe sur intérêts (1000 = 10 %)
    insuranceBps: integer('insurance_bps').default(0).notNull(), // assurance/an (110 = 1,1 %)
    feesUpfront: integer('fees_upfront').default(0).notNull(), // frais de dossier (ligne 0)
    firstDueDate: text('first_due_date'), // YYYY-MM-DD | null — 1ʳᵉ échéance
    firstPeriodDays: integer('first_period_days').default(30).notNull(), // prorata 1ʳᵉ période
    archived: integer('archived', { mode: 'boolean' }).default(false).notNull(),
    ...timestamps(),
  },
  (t) => [index('loans_user_idx').on(t.userId)],
)

/* ──────────────────────── Amortissement ──────────────────────────── */
export const amortization = sqliteTable(
  'amortization',
  {
    id: pk(),
    userId: userId(),
    loanId: text('loan_id')
      .notNull()
      .references(() => loans.id, { onDelete: 'cascade' }),
    periodMonth: text('period_month').notNull(), // YYYY-MM
    principalPart: integer('principal_part').notNull(),
    interestPart: integer('interest_part').notNull(),
    // Mode tout-compris : parts taxe/assurance par échéance (null = prêt simple).
    taxPart: integer('tax_part'),
    insurancePart: integer('insurance_part'),
    remainingAfter: integer('remaining_after').notNull(),
    sort: integer('sort').default(0).notNull(),
  },
  (t) => [
    index('amortization_user_idx').on(t.userId),
    index('amortization_loan_idx').on(t.loanId),
  ],
)

/* ───────────────────── Paiements de prêt ─────────────────────────── */
export const loanPayments = sqliteTable(
  'loan_payments',
  {
    id: pk(),
    userId: userId(),
    loanId: text('loan_id')
      .notNull()
      .references(() => loans.id, { onDelete: 'cascade' }),
    periodMonth: text('period_month').notNull(), // YYYY-MM
    amount: integer('amount').notNull(),
    dueDate: text('due_date').notNull(), // YYYY-MM-DD
    // 'paid' | 'upcoming'
    status: text('status').notNull(),
  },
  (t) => [
    index('loan_payments_user_idx').on(t.userId),
    index('loan_payments_loan_idx').on(t.loanId),
  ],
)

/* ──────────────────────── Notifications ──────────────────────────── */
export const notifications = sqliteTable(
  'notifications',
  {
    id: pk(),
    userId: userId(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    // '' | 'ok' | 'warn' | 'over'
    tone: text('tone'),
    icon: text('icon').notNull(),
    read: integer('read', { mode: 'boolean' }).default(false).notNull(),
    // Deep-link contextuel (Phase 11). Cible résolue côté serveur en `href` :
    // 'budget'|'goal'|'account' → page détail /:id (link_id requis) ; 'loan' → /pret ;
    // 'transactions' → /transactions (link_id = categoryId optionnel) ; 'analytics' → /analytics.
    // null = notification purement informative (ligne non cliquable). Aucun id orphelin.
    linkType: text('link_type'),
    linkId: text('link_id'),
    ...timestamps(),
  },
  (t) => [index('notifications_user_idx').on(t.userId)],
)

/* ───────────────────────── Récurrences ───────────────────────────── */
export const recurrences = sqliteTable(
  'recurrences',
  {
    id: pk(),
    userId: userId(),
    name: text('name').notNull(),
    amount: integer('amount').notNull(), // entier FCFA signé
    frequency: text('frequency').notNull(), // 'monthly'
    nextDate: text('next_date').notNull(), // YYYY-MM-DD
    known: integer('known', { mode: 'boolean' }).default(false).notNull(),
    categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
    accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [index('recurrences_user_idx').on(t.userId)],
)

/* ─────────── Agrégats (couche de présentation — voir en-tête) ─────────── */
export const monthlySummaries = sqliteTable(
  'monthly_summaries',
  {
    id: pk(),
    userId: userId(),
    month: text('month').notNull(), // YYYY-MM
    // Totaux NULLABLES depuis la bascule de la façade (chantier dérivation) : le
    // MOIS COURANT (DERIVED_MONTH) dérive ses totaux de SUM(transactions) — sa ligne
    // ici porte des totaux NULL (plus une source). Les mois PASSÉS gardent leurs
    // totaux pleins (historique autoritaire du trend). Voir façade getMonthlySummary.
    revenus: integer('revenus'),
    depenses: integer('depenses'),
    epargne: integer('epargne'),
    // Évolution du solde m/m, en dixièmes de % (32 = 3,2 %). Valeur EXACTE du
    // wireframe, recopiée à l'affichage (jamais dérivée — pas d'historique de solde).
    // Reste seule donnée non-NULL de la ligne du mois courant. Nullable (mois sans valeur).
    balanceDeltaPct: integer('balance_delta_pct'),
    ...timestamps(),
  },
  (t) => [
    index('monthly_summaries_user_idx').on(t.userId),
    unique('monthly_summaries_user_month_uq').on(t.userId, t.month),
  ],
)

/**
 * Dépense TOTALE par catégorie sur le mois (couche de présentation).
 * NB : `category_summaries.amount` (dépense totale catégorie) ≠ `budgets.spent`
 * (consommé sur l'enveloppe budgétée, plafonné par `cap`) — DEUX MESURES
 * DISTINCTES du wireframe, pas une incohérence (`amount ≥ spent`).
 */
export const categorySummaries = sqliteTable(
  'category_summaries',
  {
    id: pk(),
    userId: userId(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    month: text('month').notNull(), // YYYY-MM
    amount: integer('amount').notNull(),
    // tendance m/m en % entier signé (ex. +6, 0, -3)
    trendPct: integer('trend_pct').default(0).notNull(),
    ...timestamps(),
  },
  (t) => [
    index('category_summaries_user_idx').on(t.userId),
    unique('category_summaries_user_cat_month_uq').on(t.userId, t.categoryId, t.month),
  ],
)

/* ──────────────────────────── Relations ──────────────────────────── */
export const accountsRelations = relations(accounts, ({ many, one }) => ({
  transactions: many(transactions),
  contributions: many(contributions),
  envelope: one(envelopes, { fields: [accounts.id], references: [envelopes.accountId] }),
}))

export const envelopesRelations = relations(envelopes, ({ one }) => ({
  account: one(accounts, { fields: [envelopes.accountId], references: [accounts.id] }),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  budgets: many(budgets),
  categorySummaries: many(categorySummaries),
  recurrences: many(recurrences),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
}))

export const budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, { fields: [budgets.categoryId], references: [categories.id] }),
}))

export const goalsRelations = relations(goals, ({ many }) => ({
  contributions: many(contributions),
}))

export const contributionsRelations = relations(contributions, ({ one }) => ({
  goal: one(goals, { fields: [contributions.goalId], references: [goals.id] }),
  account: one(accounts, { fields: [contributions.accountId], references: [accounts.id] }),
}))

export const loansRelations = relations(loans, ({ many }) => ({
  amortization: many(amortization),
  payments: many(loanPayments),
}))

export const amortizationRelations = relations(amortization, ({ one }) => ({
  loan: one(loans, { fields: [amortization.loanId], references: [loans.id] }),
}))

export const loanPaymentsRelations = relations(loanPayments, ({ one }) => ({
  loan: one(loans, { fields: [loanPayments.loanId], references: [loans.id] }),
}))

export const categorySummariesRelations = relations(categorySummaries, ({ one }) => ({
  category: one(categories, {
    fields: [categorySummaries.categoryId],
    references: [categories.id],
  }),
}))
