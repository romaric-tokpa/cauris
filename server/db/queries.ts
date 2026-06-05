/**
 * Couche d'accès aux données métier (lecture/écriture) — Phase 3, Bloc C.
 *
 * RÈGLE NON NÉGOCIABLE (CLAUDE.md) : pas de RLS. **Toute** fonction est scopée au
 * `userId` passé en argument et applique `where user_id = userId`. Aucune requête
 * métier ne doit omettre ce filtre (jamais de données non scopées renvoyées).
 *
 * Les écrans (phases suivantes) consomment CES fonctions, jamais `db` directement.
 */
import { and, asc, desc, eq, gte, like, lt, lte, ne, or, sql, type SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import { db } from './client'
import {
  accounts,
  amortization,
  budgets,
  categories,
  categorySummaries,
  contributions,
  envelopes,
  goals,
  loanPayments,
  loans,
  monthlySummaries,
  notifications,
  recurrences,
  transactions,
} from './business-schema'

/* ─────────────────────────────── Comptes ─────────────────────────────── */
/** Comptes ACTIFS (archivés exclus) — listes UI + sélecteurs. Comme listGoals/listBudgets. */
export function listAccounts(userId: string) {
  return db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.archived, false)))
    .orderBy(asc(accounts.sort))
}

/** TOUS les comptes (archivés inclus) — base de la dérivation des soldes (init sans fantôme). */
function listAllAccountsRaw(userId: string) {
  return db.select().from(accounts).where(eq(accounts.userId, userId))
}

/** Détail d'un compte du user (null si inexistant / à autrui). Ligne brute : le
 *  masquage du solde (compte bloqué) est appliqué au niveau ROUTE (maskAccount). */
export async function getAccountById(userId: string, id: string) {
  const rows = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .limit(1)
  return rows[0] ?? null
}

/** Données d'écriture d'un compte (solde entier FCFA ; `blocked` géré à part). */
export interface AccountWriteInput {
  name: string
  bank: string
  type: string
  accountNumber: string
  balance: number
}

export function createAccount(userId: string, input: AccountWriteInput) {
  return db.insert(accounts).values({ userId, ...input }).returning()
}

/** Écriture scopée : ne met à jour que si (id, user_id) correspond. */
export function updateAccount(userId: string, id: string, input: AccountWriteInput) {
  return db
    .update(accounts)
    .set(input)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .returning()
}

/** Blocage / déblocage scopé (le solde réel est conservé ; masqué au niveau route). */
export function setAccountBlocked(userId: string, id: string, blocked: boolean) {
  return db
    .update(accounts)
    .set({ blocked })
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .returning()
}

/**
 * MODÈLE B — SOURCE UNIQUE DES SOLDES COURANTS (dérivés). Tout consommateur de solde
 * passe par ici : `accounts.balance` est le SOLDE INITIAL, et le courant =
 * `initial + Σ(mouvements du compte)`.
 *
 * Mouvements (montant signé : revenu > 0, dépense/transfert < 0) :
 *  - dépense / revenu / récurrente : `compte(accountId) += amount`
 *  - transfert : `source(accountId) += amount` (débit) ET `dest(transferAccountId) += −amount` (crédit)
 *
 * Les **contributions NE débitent PAS** le compte (statu quo Phase 7, dette MISE À JOUR :
 * une contribution est un TRANSFERT vers de l'épargne fléchée, pas une dépense ; la débiter
 * sans compter l'objectif dans le patrimoine casserait l'invariant « l'argent disparaît ».
 * À traiter avec l'intégration objectifs ↔ patrimoine — chantier SÉPARÉ).
 *
 * Renvoie une Map { accountId → solde courant dérivé } (NON masqué : le masquage du compte
 * bloqué est appliqué APRÈS, au niveau route).
 */
export async function computeAccountBalances(userId: string): Promise<Map<string, number>> {
  const [accts, txns] = await Promise.all([
    listAllAccountsRaw(userId), // TOUS les comptes (init correcte même pour un archivé)
    db
      .select({
        accountId: transactions.accountId,
        transferAccountId: transactions.transferAccountId,
        amount: transactions.amount,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId)),
  ])
  const balances = new Map<string, number>(accts.map((a) => [a.id, a.balance]))
  for (const t of txns) {
    balances.set(t.accountId, (balances.get(t.accountId) ?? 0) + t.amount)
    if (t.transferAccountId)
      balances.set(t.transferAccountId, (balances.get(t.transferAccountId) ?? 0) - t.amount)
  }
  return balances
}

/** Patrimoine = Σ des soldes dérivés des comptes ACTIFS (bloqués inclus & masqués ;
 *  archivés EXCLUS — un compte clôturé sort du patrimoine). Un transfert interne
 *  (−X source, +X dest) laisse cette somme INCHANGÉE entre comptes actifs (invariant). */
export async function computeNetWorth(userId: string): Promise<number> {
  const [balances, active] = await Promise.all([
    computeAccountBalances(userId),
    listAccounts(userId),
  ])
  let total = 0
  for (const a of active) total += balances.get(a.id) ?? 0
  return total
}

/** Comptes ACTIFS portant une enveloppe (cash mode allégé) → exclus de l'AGRÉGAT D'AFFICHAGE. */
export async function envelopeAccountIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ accountId: envelopes.accountId })
    .from(envelopes)
    .where(eq(envelopes.userId, userId))
  return new Set(rows.map((r) => r.accountId))
}

/**
 * AGRÉGAT D'AFFICHAGE « Solde total » (fidélité wireframe) = Σ soldes dérivés des comptes
 * actifs **hors enveloppe**. ⚠ Ce n'est PAS le patrimoine comptable : `computeNetWorth`
 * reste la vérité complète (cash inclus) pour le coach / la trésorerie. Distinction
 * documentée et assertée (display 2 480 000 ≠ patrimoine complet 2 518 000).
 */
export async function computeDisplayTotal(userId: string): Promise<number> {
  const [balances, active, envIds] = await Promise.all([
    computeAccountBalances(userId),
    listAccounts(userId),
    envelopeAccountIds(userId),
  ])
  let total = 0
  for (const a of active) if (!envIds.has(a.id)) total += balances.get(a.id) ?? 0
  return total
}

/** Enveloppe d'un compte (ou null) — scopée. */
export async function getEnvelopeByAccountId(userId: string, accountId: string) {
  const rows = await db
    .select()
    .from(envelopes)
    .where(and(eq(envelopes.userId, userId), eq(envelopes.accountId, accountId)))
    .limit(1)
  return rows[0] ?? null
}

export interface EnvelopeWriteInput {
  accountId: string
  cap: number
  period: string
  lastReconciledAt: string | null
}

export function createEnvelope(userId: string, input: EnvelopeWriteInput) {
  return db.insert(envelopes).values({ userId, ...input }).returning()
}

/** Marque la réconciliation (date) — scopée. La dépense agrégée est une transaction à part. */
export function setEnvelopeReconciled(userId: string, id: string, date: string) {
  return db
    .update(envelopes)
    .set({ lastReconciledAt: date })
    .where(and(eq(envelopes.id, id), eq(envelopes.userId, userId)))
    .returning()
}

/** Archivage / réactivation scopé (réversible — l'archivé sort des listes & du patrimoine). */
export function setAccountArchived(userId: string, id: string, archived: boolean) {
  return db
    .update(accounts)
    .set({ archived })
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .returning()
}

/** Références d'un compte = nombre d'opérations qui le citent (source OU destination de
 *  transfert). Garde le DELETE (0 → supprimable ; sinon archiver). */
export async function countAccountReferences(userId: string, id: string): Promise<number> {
  const rows = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        or(eq(transactions.accountId, id), eq(transactions.transferAccountId, id)),
      ),
    )
  return rows.length
}

/** Ensemble des comptes référencés par ≥1 opération (source ou destination) — batch pour
 *  marquer `deletable` sur la liste sans N+1 requêtes. */
export async function referencedAccountIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ a: transactions.accountId, t: transactions.transferAccountId })
    .from(transactions)
    .where(eq(transactions.userId, userId))
  const set = new Set<string>()
  for (const r of rows) {
    set.add(r.a)
    if (r.t) set.add(r.t)
  }
  return set
}

/** Suppression dure scopée (n'appeler QUE si 0 référence — cf. route + FK RESTRICT). */
export function deleteAccount(userId: string, id: string) {
  return db
    .delete(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .returning()
}

/* ───────────────────────────── Catégories ────────────────────────────── */
export function listCategories(userId: string) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.sort))
}

/** Catégorie scopée par id (appartenance → null si absente / autre user). */
export async function getCategoryById(userId: string, id: string) {
  const rows = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .limit(1)
  return rows[0] ?? null
}

/** Données d'écriture d'une catégorie (validées par l'appelant). `colorToken` ∈ cat-1..6. */
export interface CategoryWriteInput {
  name: string
  kind: string // 'expense' | 'income'
  colorToken: string | null
}

/** Création scopée — `sort` placé en fin de liste (max(sort)+1) pour un ordre stable. */
export async function createCategory(userId: string, input: CategoryWriteInput) {
  const rows = await db
    .select({ sort: categories.sort })
    .from(categories)
    .where(eq(categories.userId, userId))
  const nextSort = rows.reduce((m, r) => Math.max(m, r.sort), -1) + 1
  return db.insert(categories).values({ userId, sort: nextSort, ...input }).returning()
}

/** Édition scopée (nom / type / couleur). */
export function updateCategory(userId: string, id: string, input: CategoryWriteInput) {
  return db
    .update(categories)
    .set(input)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning()
}

/** Suppression dure scopée (n'appeler QUE si 0 référence — cf. route + FK RESTRICT). */
export function deleteCategory(userId: string, id: string) {
  return db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning()
}

/** Références d'une catégorie : nombre d'opérations + de budgets liés (garde du 409). */
export async function countCategoryReferences(
  userId: string,
  categoryId: string,
): Promise<{ transactions: number; budgets: number }> {
  const [txnRows, budgetRows] = await Promise.all([
    db
      .select({ id: transactions.id })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.categoryId, categoryId))),
    db
      .select({ id: budgets.id })
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.categoryId, categoryId))),
  ])
  return { transactions: txnRows.length, budgets: budgetRows.length }
}

/* ──────────────────────────── Transactions ───────────────────────────── */
export interface TransactionFilter {
  type?: string // 'Dépense' | 'Revenu' | 'Transfert' | 'Récurrente'
  accountId?: string
  categoryId?: string
  from?: string // YYYY-MM-DD inclusif
  to?: string // YYYY-MM-DD inclusif
  search?: string // sous-chaîne du libellé
  limit?: number
  offset?: number
}

/** Conditions de filtre scopées `user_id` — factorisées (liste + stats). */
function buildTxnConditions(userId: string, filter: TransactionFilter): SQL[] {
  const conds: SQL[] = [eq(transactions.userId, userId)]
  if (filter.type) conds.push(eq(transactions.type, filter.type))
  if (filter.accountId) conds.push(eq(transactions.accountId, filter.accountId))
  if (filter.categoryId) conds.push(eq(transactions.categoryId, filter.categoryId))
  if (filter.from) conds.push(gte(transactions.occurredAt, filter.from))
  if (filter.to) conds.push(lte(transactions.occurredAt, filter.to))
  if (filter.search) conds.push(like(transactions.label, `%${filter.search}%`))
  return conds
}

export function listTransactions(userId: string, filter: TransactionFilter = {}) {
  const q = db
    .select()
    .from(transactions)
    .where(and(...buildTxnConditions(userId, filter)))
    .orderBy(desc(transactions.occurredAt))
  return filter.limit ? q.limit(filter.limit) : q
}

/** Liste enrichie (noms compte source / catégorie / compte de transfert). Scopée. */
export function listTransactionsDetailed(userId: string, filter: TransactionFilter = {}) {
  const transferAcc = alias(accounts, 'transfer_acc')
  let q = db
    .select({
      id: transactions.id,
      accountId: transactions.accountId,
      categoryId: transactions.categoryId,
      transferAccountId: transactions.transferAccountId,
      label: transactions.label,
      note: transactions.note,
      amount: transactions.amount,
      occurredAt: transactions.occurredAt,
      type: transactions.type,
      channel: transactions.channel,
      accountName: accounts.name,
      categoryName: categories.name,
      transferAccountName: transferAcc.name,
    })
    .from(transactions)
    .leftJoin(accounts, eq(accounts.id, transactions.accountId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .leftJoin(transferAcc, eq(transferAcc.id, transactions.transferAccountId))
    .where(and(...buildTxnConditions(userId, filter)))
    .orderBy(desc(transactions.occurredAt))
    .$dynamic()
  if (filter.limit !== undefined) q = q.limit(filter.limit)
  if (filter.offset !== undefined) q = q.offset(filter.offset)
  return q
}

/**
 * Stats d'en-tête (scopées). **Les transferts sont EXCLUS** de entrées/sorties :
 * un transfert entre comptes propres n'est ni un revenu ni une dépense (sinon le
 * net est faussé). `count` compte toutes les opérations (transferts inclus).
 */
export async function getTransactionStats(userId: string, filter: TransactionFilter = {}) {
  const rows = await db
    .select({
      entrees: sql<number>`coalesce(sum(case when ${transactions.type} != 'Transfert' and ${transactions.amount} > 0 then ${transactions.amount} else 0 end), 0)`,
      sorties: sql<number>`coalesce(sum(case when ${transactions.type} != 'Transfert' and ${transactions.amount} < 0 then ${transactions.amount} else 0 end), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .where(and(...buildTxnConditions(userId, filter)))
  const r = rows[0]
  return { entrees: r.entrees, sorties: r.sorties, net: r.entrees + r.sorties, count: r.count }
}

/** Détail enrichi d'une transaction du user (null si inexistante / à autrui). */
export async function getTransactionById(userId: string, id: string) {
  const transferAcc = alias(accounts, 'transfer_acc')
  const rows = await db
    .select({
      id: transactions.id,
      accountId: transactions.accountId,
      categoryId: transactions.categoryId,
      transferAccountId: transactions.transferAccountId,
      label: transactions.label,
      note: transactions.note,
      amount: transactions.amount,
      occurredAt: transactions.occurredAt,
      type: transactions.type,
      channel: transactions.channel,
      accountName: accounts.name,
      categoryName: categories.name,
      transferAccountName: transferAcc.name,
    })
    .from(transactions)
    .leftJoin(accounts, eq(accounts.id, transactions.accountId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .leftJoin(transferAcc, eq(transferAcc.id, transactions.transferAccountId))
    .where(and(eq(transactions.userId, userId), eq(transactions.id, id)))
    .limit(1)
  return rows[0] ?? null
}

/** Appartenance d'un compte au user (vérif avant rattachement d'une écriture). */
export async function userOwnsAccount(userId: string, accountId: string): Promise<boolean> {
  const r = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.id, accountId)))
    .limit(1)
  return r.length > 0
}

/** Appartenance d'une catégorie au user. */
export async function userOwnsCategory(userId: string, categoryId: string): Promise<boolean> {
  const r = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)))
    .limit(1)
  return r.length > 0
}

/** Données d'écriture d'une transaction (amount DÉJÀ signé par l'appelant). */
export interface TransactionWriteInput {
  type: string
  label: string
  note: string | null
  amount: number
  accountId: string
  categoryId: string | null
  transferAccountId: string | null
  occurredAt: string
  // Canal de paiement ∈ liste fermée, ou null (Transfert). Validé en amont (parseTxnInput).
  channel: string | null
}

export function createTransaction(userId: string, input: TransactionWriteInput) {
  return db.insert(transactions).values({ userId, ...input }).returning()
}

/** Écriture scopée : ne met à jour que si (id, user_id) correspond. */
export function updateTransaction(userId: string, id: string, input: TransactionWriteInput) {
  return db
    .update(transactions)
    .set(input)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning()
}

/** Suppression scopée. */
export function deleteTransaction(userId: string, id: string) {
  return db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
}

/* ─────────────────────────────── Budgets ─────────────────────────────── */
const budgetCols = {
  id: budgets.id,
  categoryId: budgets.categoryId,
  categoryName: categories.name,
  colorToken: categories.colorToken,
  cap: budgets.cap,
  spent: budgets.spent,
  txnCount: budgets.txnCount,
  period: budgets.period,
  frequency: budgets.frequency,
  alertPct: budgets.alertPct,
  rollover: budgets.rollover,
  archived: budgets.archived,
}

/** Budgets ACTIFS du mois (jointure catégorie pour nom + token couleur du donut).
 *  Les budgets archivés sont exclus (cf. listArchivedBudgets). */
export function listBudgets(userId: string, period?: string) {
  const conds: SQL[] = [eq(budgets.userId, userId), eq(budgets.archived, false)]
  if (period) conds.push(eq(budgets.period, period))
  return db
    .select(budgetCols)
    .from(budgets)
    .innerJoin(categories, eq(categories.id, budgets.categoryId))
    .where(and(...conds))
    .orderBy(desc(budgets.spent))
}

/** Budgets ARCHIVÉS (tous mois confondus) — onglet « Archivés ». */
export function listArchivedBudgets(userId: string) {
  return db
    .select(budgetCols)
    .from(budgets)
    .innerJoin(categories, eq(categories.id, budgets.categoryId))
    .where(and(eq(budgets.userId, userId), eq(budgets.archived, true)))
    .orderBy(desc(budgets.period))
}

/** Détail d'un budget du user (null si inexistant / à autrui). Pattern scopé. */
export async function getBudgetById(userId: string, id: string) {
  const rows = await db
    .select(budgetCols)
    .from(budgets)
    .innerJoin(categories, eq(categories.id, budgets.categoryId))
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
    .limit(1)
  return rows[0] ?? null
}

/** Données d'écriture d'un budget (plafond entier FCFA ; `spent`/`archived` gérés à part). */
export interface BudgetWriteInput {
  categoryId: string
  cap: number
  frequency: string
  alertPct: number
  rollover: boolean
  period: string
}

/**
 * `spent` d'un budget NEUF = dépenses RÉELLES de la catégorie sur la période, calculées
 * par l'appelant (route) et passées ici → snapshot STOCKÉ à la création. RÈGLE D'ASYMÉTRIE
 * (documentée, ne pas re-questionner) :
 *  - budgets SEEDÉS : `spent` = enveloppe d'origine, indépendante du ledger (distinction Phase 6) ;
 *  - budgets NEUFS : `spent` = dépense catégorie dérivée à la création (évite un 0 % trompeur
 *    quand on crée un budget en milieu de mois sur une catégorie déjà consommée).
 * Dans les deux cas `spent` est ensuite STOCKÉ (ni l'un ni l'autre ne se re-dérive à la volée).
 */
export function createBudget(userId: string, input: BudgetWriteInput, spent: number) {
  return db.insert(budgets).values({ userId, ...input, spent }).returning()
}

/** Ajustement scopé du plafond + réglages (catégorie/période/spent inchangés). */
export function updateBudget(
  userId: string,
  id: string,
  input: Pick<BudgetWriteInput, 'cap' | 'frequency' | 'alertPct' | 'rollover'>,
) {
  return db
    .update(budgets)
    .set(input)
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
    .returning()
}

/** Archivage / réactivation scopé. */
export function setBudgetArchived(userId: string, id: string, archived: boolean) {
  return db
    .update(budgets)
    .set({ archived })
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
    .returning()
}

/* ─────────────────────────────── Objectifs ───────────────────────────── */
/** Objectifs ACTIFS du user (les archivés disparaissent de la liste — pas de vue dédiée). */
export function listGoals(userId: string) {
  return db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.archived, false)))
    .orderBy(asc(goals.createdAt))
}

export function listContributions(userId: string, goalId: string) {
  return db
    .select()
    .from(contributions)
    .where(and(eq(contributions.userId, userId), eq(contributions.goalId, goalId)))
    .orderBy(desc(contributions.occurredAt))
}

/** Détail d'un objectif du user (null si inexistant / à autrui). Pattern `getBudgetById`. */
export async function getGoalById(userId: string, id: string) {
  const rows = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .limit(1)
  return rows[0] ?? null
}

/**
 * Données d'écriture d'un objectif. `currentAmount` (« Déjà épargné ») n'est posé qu'à la
 * CRÉATION ; en édition il reste piloté par les contributions (source de vérité de la
 * progression) — on ne le réécrit pas pour ne pas casser l'invariant Σ(contributions).
 */
export interface GoalWriteInput {
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string | null
}

/** Création scopée d'un objectif (validé par l'appelant : nom non vide, cible entière > 0). */
export function createGoal(userId: string, input: GoalWriteInput) {
  return db.insert(goals).values({ userId, ...input }).returning()
}

/** Édition scopée (nom / cible / date) — `currentAmount` inchangé (cf. GoalWriteInput). */
export function updateGoal(
  userId: string,
  id: string,
  input: Pick<GoalWriteInput, 'name' | 'targetAmount' | 'targetDate'>,
) {
  return db
    .update(goals)
    .set(input)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning()
}

/** Archivage / réactivation scopé (réversible — l'archivé disparaît juste de la liste). */
export function setGoalArchived(userId: string, id: string, archived: boolean) {
  return db
    .update(goals)
    .set({ archived })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning()
}

/** Nombre de contributions d'un objectif (garde la suppression dure : 0 → supprimable). */
export async function countGoalContributions(userId: string, goalId: string): Promise<number> {
  const rows = await db
    .select({ id: contributions.id })
    .from(contributions)
    .where(and(eq(contributions.userId, userId), eq(contributions.goalId, goalId)))
  return rows.length
}

/** Suppression dure scopée (n'à appeler QUE si 0 contribution — cf. route). */
export function deleteGoal(userId: string, id: string) {
  return db
    .delete(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning()
}

/** Entrée d'écriture d'une contribution (montant entier FCFA > 0, validé par l'appelant). */
export interface ContributionWriteInput {
  goalId: string
  accountId: string | null
  amount: number
  occurredAt: string
}

/**
 * Ajoute une contribution À UN objectif du user et fait progresser l'objectif, de
 * façon ATOMIQUE : insère la ligne d'historique PUIS incrémente `goals.current_amount`
 * (scopé `and(id, userId)`). Renvoie la contribution + l'objectif mis à jour.
 *
 * NB Phase 7 (dette assumée, documentée) : on n'altère PAS `accounts.balance` du compte
 * source — pas de double-écriture comptable ici (cf. dette agrégats). `current_amount`
 * reste la source de vérité de la progression ; `contributions` = historique des versements.
 */
export async function createContribution(userId: string, input: ContributionWriteInput) {
  return db.transaction(async (tx) => {
    const [contribution] = await tx
      .insert(contributions)
      .values({ userId, ...input })
      .returning()
    const [goal] = await tx
      .update(goals)
      .set({ currentAmount: sql`${goals.currentAmount} + ${input.amount}` })
      .where(and(eq(goals.id, input.goalId), eq(goals.userId, userId)))
      .returning()
    return { contribution, goal }
  })
}

/* ──────────────────────────────── Prêts ──────────────────────────────── */
export function listLoans(userId: string) {
  return db.select().from(loans).where(eq(loans.userId, userId)).orderBy(asc(loans.createdAt))
}

export function listAmortization(userId: string, loanId: string) {
  return db
    .select()
    .from(amortization)
    .where(and(eq(amortization.userId, userId), eq(amortization.loanId, loanId)))
    .orderBy(asc(amortization.sort))
}

export function listLoanPayments(userId: string, loanId: string) {
  return db
    .select()
    .from(loanPayments)
    .where(and(eq(loanPayments.userId, userId), eq(loanPayments.loanId, loanId)))
    .orderBy(desc(loanPayments.dueDate))
}

/** Prêt + échéancier + paiements, en une lecture scopée (null si absent/à autrui). */
export async function getLoanWithSchedule(userId: string, loanId: string) {
  const found = await db
    .select()
    .from(loans)
    .where(and(eq(loans.userId, userId), eq(loans.id, loanId)))
    .limit(1)
  if (!found.length) return null
  const [schedule, payments] = await Promise.all([
    listAmortization(userId, loanId),
    listLoanPayments(userId, loanId),
  ])
  return { loan: found[0], amortization: schedule, payments }
}

/* ───────────────────────────── Notifications ─────────────────────────── */
export function listNotifications(userId: string, opts: { unreadOnly?: boolean } = {}) {
  const conds: SQL[] = [eq(notifications.userId, userId)]
  if (opts.unreadOnly) conds.push(eq(notifications.read, false))
  return db
    .select()
    .from(notifications)
    .where(and(...conds))
    .orderBy(desc(notifications.createdAt))
}

/** Détail d'une notification du user (null si inexistante / à autrui). Vérif
 *  d'appartenance avant écriture (pattern getTransactionById → 404 côté route). */
export async function getNotificationById(userId: string, id: string) {
  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .limit(1)
  return rows[0] ?? null
}

/** Nombre de notifications non lues du user (badge cloche + payloads). Scopé. */
export async function countUnreadNotifications(userId: string): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
  return rows[0]?.n ?? 0
}

/** Écriture scopée : marque une notification de CE user comme lue (ligne renvoyée). */
export function markNotificationRead(userId: string, notificationId: string) {
  return db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.id, notificationId)))
    .returning()
}

/** Écriture scopée : marque TOUTES les non-lues du user comme lues (« Tout marquer
 *  comme lu »). N'agit que sur les non-lues (idempotent). */
export function markAllNotificationsRead(userId: string) {
  return db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
}

/* ───────────────────────────── Récurrences ───────────────────────────── */
export function listRecurrences(userId: string) {
  return db
    .select()
    .from(recurrences)
    .where(eq(recurrences.userId, userId))
    .orderBy(asc(recurrences.nextDate))
}

/** Lecture scopée (appartenance) → row | null (patron 404 avant PATCH/DELETE). */
export async function getRecurrenceById(userId: string, id: string) {
  const rows = await db
    .select()
    .from(recurrences)
    .where(and(eq(recurrences.userId, userId), eq(recurrences.id, id)))
    .limit(1)
  return rows[0] ?? null
}

/** Données d'écriture d'une récurrence (amount DÉJÀ signé par l'appelant). */
export interface RecurrenceWriteInput {
  name: string
  amount: number
  frequency: string
  nextDate: string
  known: boolean
  categoryId: string | null
  accountId: string | null
}

export function createRecurrence(userId: string, input: RecurrenceWriteInput) {
  return db.insert(recurrences).values({ userId, ...input }).returning()
}

/** Écriture scopée : ne met à jour que si (id, user_id) correspond. */
export function updateRecurrence(userId: string, id: string, input: RecurrenceWriteInput) {
  return db
    .update(recurrences)
    .set(input)
    .where(and(eq(recurrences.id, id), eq(recurrences.userId, userId)))
    .returning()
}

/** Suppression scopée. */
export function deleteRecurrence(userId: string, id: string) {
  return db
    .delete(recurrences)
    .where(and(eq(recurrences.id, id), eq(recurrences.userId, userId)))
}

/* ════════════════════════════ Façade agrégats ════════════════════════════
 * POINT CLÉ. Les écrans n'appellent QUE cette façade, jamais les tables
 * `monthly_summaries` / `category_summaries` directement.
 *
 * SOURCE UNIQUE = LE LEDGER pour le **mois courant** (`DERIVED_MONTH`). La façade
 * SOMME `transactions` (transferts exclus) pour ce mois → KPI dépenses + donut
 * **bougent à chaque mutation** (dette « deux vérités » levée). Les mois PASSÉS
 * sont lus dans `monthly_summaries` / `category_summaries` (historique autoritaire
 * du trend ; règle « passé = table, présent = ledger » — cf. seed.ts).
 *
 * Non dérivables (restent stockés / hors façade) :
 *  - `balance_delta_pct` : pas d'historique de solde → lu en table (recopié, pas dérivé).
 *  - `budget.spent` : enveloppe budgétée indépendante (≠ dépense totale de catégorie ;
 *    Alimentation spent 185 000 > total 171 000) → reste stocké (cf. listBudgets).
 *  - `trendPct` du donut : m/m non dérivable sans snapshot du mois précédent → 0
 *    pour le mois dérivé (le donut n'affiche PAS trendPct ; documenté).
 * ════════════════════════════════════════════════════════════════════════ */

/** Le seul mois à ledger vivant : ses agrégats sont DÉRIVÉS de `transactions`. */
export const DERIVED_MONTH = '2026-05'

/** Totaux d'un mois dérivés du ledger (transferts EXCLUS). dépenses ≥ 0. */
async function deriveMonthTotals(userId: string, month: string) {
  const rows = await db
    .select({
      revenus: sql<number>`coalesce(sum(case when ${transactions.type} != 'Transfert' and ${transactions.amount} > 0 then ${transactions.amount} else 0 end), 0)`,
      depensesNeg: sql<number>`coalesce(sum(case when ${transactions.type} != 'Transfert' and ${transactions.amount} < 0 then ${transactions.amount} else 0 end), 0)`,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), like(transactions.occurredAt, `${month}-%`)))
  const revenus = rows[0].revenus
  const depenses = -rows[0].depensesNeg // somme des négatifs → dépense positive
  return { revenus, depenses, epargne: revenus - depenses }
}

/**
 * Revenus / dépenses / épargne du mois (YYYY-MM). Forme : `{ month, revenus,
 * depenses, epargne, balanceDeltaPct } | null`.
 * - Mois courant (`DERIVED_MONTH`) : totaux dérivés du ledger ; `balanceDeltaPct`
 *   lu en table (non dérivable). Mois « hybride » : NULL en table tolérés.
 * - Mois passés : ligne historique de `monthly_summaries` (totaux pleins).
 */
export async function getMonthlySummary(userId: string, month: string) {
  const rows = await db
    .select({
      month: monthlySummaries.month,
      revenus: monthlySummaries.revenus,
      depenses: monthlySummaries.depenses,
      epargne: monthlySummaries.epargne,
      balanceDeltaPct: monthlySummaries.balanceDeltaPct,
    })
    .from(monthlySummaries)
    .where(and(eq(monthlySummaries.userId, userId), eq(monthlySummaries.month, month)))
    .limit(1)
  const row = rows[0] ?? null

  if (month === DERIVED_MONTH) {
    const totals = await deriveMonthTotals(userId, month)
    return { month, ...totals, balanceDeltaPct: row?.balanceDeltaPct ?? null }
  }
  return row
}

/**
 * Façade (suite) : série des résumés mensuels pour le trend cashflow 6 mois,
 * ordre chronologique. Mois passés = ligne historique ; mois courant = point
 * DÉRIVÉ du ledger (sa ligne table porte des totaux NULL). Seule porte d'accès
 * aux résumés mensuels : aucun écran/route ne lit la table en direct.
 */
export async function listMonthlySummaries(userId: string) {
  const rows = await db
    .select({
      month: monthlySummaries.month,
      revenus: monthlySummaries.revenus,
      depenses: monthlySummaries.depenses,
      epargne: monthlySummaries.epargne,
    })
    .from(monthlySummaries)
    .where(eq(monthlySummaries.userId, userId))
    .orderBy(asc(monthlySummaries.month))
  const derived = await deriveMonthTotals(userId, DERIVED_MONTH)
  return rows.map((r) => (r.month === DERIVED_MONTH ? { month: r.month, ...derived } : r))
}

/**
 * Répartition des dépenses par catégorie pour le mois (donut).
 * - Mois courant : DÉRIVÉ de `SUM(transactions, amount<0, hors Transfert)` groupé
 *   par catégorie (`amount` ≥ 0 ; `trendPct = 0` non dérivable — non affiché).
 * - Mois passés : `category_summaries` (historique).
 * Le donut est re-trié côté client par `colorToken` → l'ordre SQL est indifférent.
 */
export async function getCategoryBreakdown(userId: string, month: string) {
  if (month === DERIVED_MONTH) {
    return db
      .select({
        categoryId: transactions.categoryId,
        name: categories.name,
        colorToken: categories.colorToken,
        amount: sql<number>`-sum(${transactions.amount})`, // négatifs → dépense positive
        trendPct: sql<number>`0`,
      })
      .from(transactions)
      .innerJoin(categories, eq(categories.id, transactions.categoryId))
      .where(
        and(
          eq(transactions.userId, userId),
          like(transactions.occurredAt, `${month}-%`),
          lt(transactions.amount, 0),
          ne(transactions.type, 'Transfert'),
        ),
      )
      .groupBy(transactions.categoryId)
      .orderBy(asc(sql`sum(${transactions.amount})`)) // plus négatif d'abord = plus grosse dépense
  }
  return db
    .select({
      categoryId: categorySummaries.categoryId,
      name: categories.name,
      colorToken: categories.colorToken, // 'cat-N' → var(--cat-N) côté rendu
      amount: categorySummaries.amount,
      trendPct: categorySummaries.trendPct,
    })
    .from(categorySummaries)
    .innerJoin(categories, eq(categories.id, categorySummaries.categoryId))
    .where(and(eq(categorySummaries.userId, userId), eq(categorySummaries.month, month)))
    .orderBy(desc(categorySummaries.amount))
}

/**
 * Nombre d'opérations de DÉPENSE par catégorie pour le mois (colonne « N opér. »
 * de l'onglet Catégories d'Analytics). DÉRIVÉ du ledger, mêmes filtres que le donut
 * dérivé (`amount < 0`, hors Transfert) → cohérent avec `getCategoryBreakdown`.
 * Scopé `user_id`. Renvoie `{ categoryId, txnCount }[]` ; une catégorie sans dépense
 * du mois est simplement absente (compteur 0 côté route). Le mois courant porte le
 * ledger vivant ; un mois passé (sans transactions) renverrait une série vide — Analytics
 * vise le mois courant (`DEMO_MONTH`), ce qui est l'usage prévu.
 */
export function getCategoryTxnCounts(userId: string, month: string) {
  return db
    .select({
      categoryId: transactions.categoryId,
      txnCount: sql<number>`count(*)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        like(transactions.occurredAt, `${month}-%`),
        lt(transactions.amount, 0),
        ne(transactions.type, 'Transfert'),
      ),
    )
    .groupBy(transactions.categoryId)
}
