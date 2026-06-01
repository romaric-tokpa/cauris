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
 * `monthly_summaries` et `category_summaries` sont une **couche de présentation** :
 * elles existent uniquement pour reproduire à l'identique les chiffres d'un wireframe
 * incohérent. À terme (vraies données) ces agrégats seront **dérivés** de
 * `SUM(transactions)` — voir la façade `getMonthlySummary` / `getCategoryBreakdown`
 * (dette explicite, Bloc C). Aucun écran ne doit les requêter directement.
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
    balance: integer('balance').notNull(),
    blocked: integer('blocked', { mode: 'boolean' }).default(false).notNull(),
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
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
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
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    cap: integer('cap').notNull(),
    spent: integer('spent').default(0).notNull(),
    txnCount: integer('txn_count').default(0).notNull(),
    period: text('period').notNull(), // YYYY-MM
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
    revenus: integer('revenus').notNull(),
    depenses: integer('depenses').notNull(),
    epargne: integer('epargne').notNull(),
    // Évolution du solde m/m, en dixièmes de % (32 = 3,2 %). Valeur EXACTE du
    // wireframe, recopiée à l'affichage (jamais dérivée). Nullable (mois sans valeur).
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
export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
  contributions: many(contributions),
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
