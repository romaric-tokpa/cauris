/**
 * Couche d'accès aux données métier (lecture/écriture) — Phase 3, Bloc C.
 *
 * RÈGLE NON NÉGOCIABLE (CLAUDE.md) : pas de RLS. **Toute** fonction est scopée au
 * `userId` passé en argument et applique `where user_id = userId`. Aucune requête
 * métier ne doit omettre ce filtre (jamais de données non scopées renvoyées).
 *
 * Les écrans (phases suivantes) consomment CES fonctions, jamais `db` directement.
 */
import { and, asc, desc, eq, gte, lte, type SQL } from 'drizzle-orm'
import { db } from './client'
import {
  accounts,
  amortization,
  budgets,
  categories,
  categorySummaries,
  contributions,
  goals,
  loanPayments,
  loans,
  monthlySummaries,
  notifications,
  recurrences,
  transactions,
} from './business-schema'

/* ─────────────────────────────── Comptes ─────────────────────────────── */
export function listAccounts(userId: string) {
  return db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .orderBy(asc(accounts.sort))
}

/* ───────────────────────────── Catégories ────────────────────────────── */
export function listCategories(userId: string) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.sort))
}

/* ──────────────────────────── Transactions ───────────────────────────── */
export interface TransactionFilter {
  type?: string // 'Dépense' | 'Revenu' | 'Transfert' | 'Récurrente'
  accountId?: string
  categoryId?: string
  from?: string // YYYY-MM-DD inclusif
  to?: string // YYYY-MM-DD inclusif
  limit?: number
}

export function listTransactions(userId: string, filter: TransactionFilter = {}) {
  const conds: SQL[] = [eq(transactions.userId, userId)]
  if (filter.type) conds.push(eq(transactions.type, filter.type))
  if (filter.accountId) conds.push(eq(transactions.accountId, filter.accountId))
  if (filter.categoryId) conds.push(eq(transactions.categoryId, filter.categoryId))
  if (filter.from) conds.push(gte(transactions.occurredAt, filter.from))
  if (filter.to) conds.push(lte(transactions.occurredAt, filter.to))

  const q = db
    .select()
    .from(transactions)
    .where(and(...conds))
    .orderBy(desc(transactions.occurredAt))
  return filter.limit ? q.limit(filter.limit) : q
}

/* ─────────────────────────────── Budgets ─────────────────────────────── */
/** Budgets du mois (jointure catégorie pour nom + token couleur du donut). */
export function listBudgets(userId: string, period?: string) {
  const conds: SQL[] = [eq(budgets.userId, userId)]
  if (period) conds.push(eq(budgets.period, period))
  return db
    .select({
      id: budgets.id,
      categoryId: budgets.categoryId,
      categoryName: categories.name,
      colorToken: categories.colorToken,
      cap: budgets.cap,
      spent: budgets.spent,
      txnCount: budgets.txnCount,
      period: budgets.period,
    })
    .from(budgets)
    .innerJoin(categories, eq(categories.id, budgets.categoryId))
    .where(and(...conds))
    .orderBy(desc(budgets.spent))
}

/* ─────────────────────────────── Objectifs ───────────────────────────── */
export function listGoals(userId: string) {
  return db.select().from(goals).where(eq(goals.userId, userId)).orderBy(asc(goals.createdAt))
}

export function listContributions(userId: string, goalId: string) {
  return db
    .select()
    .from(contributions)
    .where(and(eq(contributions.userId, userId), eq(contributions.goalId, goalId)))
    .orderBy(desc(contributions.occurredAt))
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

/** Écriture scopée : marque une notification de CE user comme lue. */
export function markNotificationRead(userId: string, notificationId: string) {
  return db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.id, notificationId)))
}

/* ───────────────────────────── Récurrences ───────────────────────────── */
export function listRecurrences(userId: string) {
  return db
    .select()
    .from(recurrences)
    .where(eq(recurrences.userId, userId))
    .orderBy(asc(recurrences.nextDate))
}

/* ════════════════════════════ Façade agrégats ════════════════════════════
 * POINT CLÉ. Les écrans n'appellent QUE cette façade, jamais les tables
 * `monthly_summaries` / `category_summaries` directement.
 *
 * AUJOURD'HUI : lit les tables summaries (couche de présentation seedée depuis
 * le wireframe — cf. Bloc A). Ces deux fonctions sont **basculables sur
 * `SUM(transactions)` sans changer leur signature ni les écrans** : la dérivation
 * appliquera des règles distinctes pour le budget (filtré sur le périmètre de
 * l'enveloppe) et pour la dépense totale de catégorie (somme brute) — voir la
 * distinction `budget.spent` ≠ `category_summaries.amount` documentée au schéma.
 * ════════════════════════════════════════════════════════════════════════ */

/** Revenus / dépenses / épargne du mois (YYYY-MM). null si non disponible. */
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
  return rows[0] ?? null
}

/**
 * Façade (suite) : série des résumés mensuels pour le trend cashflow 6 mois,
 * ordre chronologique. Même encapsulation que `getMonthlySummary` — **basculable
 * sur `SUM(transactions)` par mois** sans changer signature ni écrans. Seule
 * porte d'accès aux résumés mensuels : aucun écran/route ne lit la table en direct.
 */
export function listMonthlySummaries(userId: string) {
  return db
    .select({
      month: monthlySummaries.month,
      revenus: monthlySummaries.revenus,
      depenses: monthlySummaries.depenses,
      epargne: monthlySummaries.epargne,
    })
    .from(monthlySummaries)
    .where(eq(monthlySummaries.userId, userId))
    .orderBy(asc(monthlySummaries.month))
}

/** Répartition des dépenses par catégorie pour le mois (donut). */
export function getCategoryBreakdown(userId: string, month: string) {
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
