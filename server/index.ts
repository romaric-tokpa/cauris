import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { client, db } from './db/client'
import { user } from './db/auth-schema'
import { auth } from './auth'
import { getSessionUserId } from './session'
import {
  getMonthlySummary,
  getCategoryBreakdown,
  listMonthlySummaries,
  listAccounts,
  listCategories,
  listBudgets,
  getBudgetById,
  listGoals,
  listContributions,
  getGoalById,
  createContribution,
  listLoans,
  listNotifications,
  listTransactions,
  listTransactionsDetailed,
  getTransactionStats,
  getTransactionById,
  userOwnsAccount,
  userOwnsCategory,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type TransactionFilter,
  type TransactionWriteInput,
} from './db/queries'

// Mois de démonstration (période de réf. produit : Mai 2026 ; le seed s'y arrête).
const DEMO_MONTH = '2026-05'

/**
 * pct/tone d'un budget — SEULE source des seuils (dashboard + écran Budgets).
 * `floor` reproduit les % du wireframe (185 000/200 000 = 92,5 % → 92). Tons :
 * `over` > 100 %, `warn` ≥ 90 %, sinon `ok`.
 */
function budgetMeta(spent: number, cap: number): { pct: number; tone: 'over' | 'warn' | 'ok' } {
  const pct = cap ? Math.floor((spent / cap) * 100) : 0
  const tone = pct > 100 ? 'over' : pct >= 90 ? 'warn' : 'ok'
  return { pct, tone }
}

/**
 * Backend Cauris (Hono).
 * - `/api/auth/*` : Better Auth (email + mot de passe).
 * - `/health`, `/health/db` : points de santé.
 * L'API métier se montera sous `/api` (Phase 3).
 */
const app = new Hono()

// Better Auth : délègue toutes les routes /api/auth/* au handler (Request/Response web).
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))

// Health check infra — accessible en direct (et via le proxy Vite /api/health).
app.get('/health', (c) => c.json({ status: 'ok' }))

// Health check base de données : prouve la connexion via un SELECT 1.
app.get('/health/db', async (c) => {
  try {
    await client.execute('select 1')
    return c.json({ status: 'ok', db: 'up' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ status: 'error', db: 'down', message }, 503)
  }
})

// API applicative.
const api = new Hono()
api.get('/health', (c) => c.json({ status: 'ok' }))

// Marque l'onboarding terminé pour l'utilisateur de la SESSION (seul chemin pour
// flipper onboarding_complete, cohérent avec input:false côté Better Auth).
api.post('/onboarding/complete', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  await db.update(user).set({ onboardingComplete: true }).where(eq(user.id, userId))
  return c.json({ status: 'ok' })
})

// Démo bout-en-bout du scoping : renvoie les agrégats du mois pour le user de
// session (via la façade). Prouve session → user_id → requête scopée. ?month=YYYY-MM.
api.get('/dashboard/summary', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const month = c.req.query('month') ?? DEMO_MONTH
  const summary = await getMonthlySummary(userId, month)
  return c.json({ month, summary })
})

// Dashboard composite : un seul payload scopé pour l'écran d'accueil. Compose
// EXCLUSIVEMENT des queries/façade scopées (server/db/queries.ts) — agrégats via
// la façade, jamais les tables summaries en direct.
api.get('/dashboard', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const month = c.req.query('month') ?? DEMO_MONTH

  const [accountsRows, summary, months, breakdown, budgetRows, goalRows, recent, cats, notifs, loanRows] =
    await Promise.all([
      listAccounts(userId),
      getMonthlySummary(userId, month),
      listMonthlySummaries(userId),
      getCategoryBreakdown(userId, month),
      listBudgets(userId, month),
      listGoals(userId),
      listTransactions(userId, { limit: 5 }),
      listCategories(userId),
      listNotifications(userId),
      listLoans(userId),
    ])

  const total = accountsRows.reduce((s, a) => s + a.balance, 0)
  const depenses = summary?.depenses ?? 0

  // Delta solde : valeur EXACTE du wireframe, stockée en dixièmes (32) → % (3,2).
  // Recopiée, jamais dérivée.
  const soldeDeltaPct =
    summary?.balanceDeltaPct != null ? summary.balanceDeltaPct / 10 : null

  const cashflow = months.map((m) => ({ m: m.month, rev: m.revenus, dep: m.depenses }))

  const breakdownOut = breakdown.map((b) => ({
    categoryId: b.categoryId,
    name: b.name,
    colorToken: b.colorToken,
    amount: b.amount,
    v: depenses ? Math.round((b.amount / depenses) * 100) : 0,
    trendPct: b.trendPct,
  }))

  const budgets = budgetRows
    .map((b) => ({ ...b, ...budgetMeta(b.spent, b.cap) }))
    .filter((b) => b.tone === 'over' || b.tone === 'warn')
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3)

  const goals = goalRows.map((g) => ({
    id: g.id,
    name: g.name,
    currentAmount: g.currentAmount,
    targetAmount: g.targetAmount,
    pct: g.targetAmount ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
  }))

  const accName = new Map(accountsRows.map((a) => [a.id, a.name]))
  const catName = new Map(cats.map((cat) => [cat.id, cat.name]))
  const recentTransactions = recent.map((t) => ({
    id: t.id,
    label: t.label,
    amount: t.amount,
    occurredAt: t.occurredAt,
    type: t.type,
    accountName: accName.get(t.accountId) ?? '',
    categoryName: t.categoryId ? (catName.get(t.categoryId) ?? '') : '',
  }))

  const accounts = accountsRows.map((a) => ({
    id: a.id,
    name: a.name,
    bank: a.bank,
    type: a.type,
    accountNumber: a.accountNumber,
    balance: a.balance,
    blocked: a.blocked,
  }))

  const lr = loanRows[0] ?? null
  const loan = lr
    ? {
        id: lr.id,
        name: lr.name,
        remaining: lr.remaining,
        principal: lr.principal,
        monthlyPayment: lr.monthlyPayment,
        rateBps: lr.rateBps,
        nextDueDate: lr.nextDueDate,
        progress: lr.principal
          ? Math.round(((lr.principal - lr.remaining) / lr.principal) * 100)
          : 0,
      }
    : null

  return c.json({
    month,
    total,
    revenus: summary?.revenus ?? null,
    depenses: summary?.depenses ?? null,
    epargne: summary?.epargne ?? null,
    soldeDeltaPct,
    cashflow,
    breakdown: breakdownOut,
    accounts,
    budgets,
    goals,
    recentTransactions,
    notifications: notifs,
    loan,
  })
})

/* ───────────────────────────────── Budgets ─────────────────────────────────
 * Lecture seule (Phase 6). pct/tone via budgetMeta (même logique que le dashboard).
 * Le DÉTAIL expose DEUX mesures du même mois, distinctes par construction :
 *  - budget.spent : enveloppe budgétée, STOCKÉE (ne bouge pas aux mutations) ;
 *  - categoryTotal : dépense TOTALE de la catégorie, DÉRIVÉE du ledger via la façade
 *    getCategoryBreakdown (bouge aux mutations). Pour Transport : 54 000 vs 116 000.
 * Scopées session ; le détail vérifie l'appartenance (getBudgetById → 404). */

// Liste des budgets de la période + résumé d'en-tête.
api.get('/budgets', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const period = c.req.query('period') ?? DEMO_MONTH
  const rows = await listBudgets(userId, period)
  const budgets = rows.map((b) => ({ ...b, ...budgetMeta(b.spent, b.cap) }))
  const totalCap = budgets.reduce((s, b) => s + b.cap, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const summary = {
    totalCap,
    totalSpent,
    pct: budgetMeta(totalSpent, totalCap).pct,
    restant: totalCap - totalSpent,
    alertCount: budgets.filter((b) => b.tone === 'warn').length, // « N en alerte »
    overCount: budgets.filter((b) => b.tone === 'over').length, // « Dépassés »
  }
  return c.json({ budgets, summary })
})

// Détail : enveloppe (stockée) + dépense catégorie (dérivée) + transactions liées.
api.get('/budgets/:id', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const b = await getBudgetById(userId, c.req.param('id'))
  if (!b) return c.json({ error: 'not found' }, 404)

  // Transactions liées = toutes les opérations de la catégorie sur la période du
  // budget (bornes du mois). Leur Σ = categoryTotal (cohérence avec la façade).
  const from = `${b.period}-01`
  const to = `${b.period}-31`
  const filter: TransactionFilter = { categoryId: b.categoryId, from, to }
  const [breakdown, linkedTransactions, linkedStats] = await Promise.all([
    getCategoryBreakdown(userId, b.period),
    listTransactionsDetailed(userId, filter),
    getTransactionStats(userId, filter),
  ])
  const categoryTotal = breakdown.find((x) => x.categoryId === b.categoryId)?.amount ?? 0
  const budget = { ...b, ...budgetMeta(b.spent, b.cap), ecart: b.spent - b.cap }
  return c.json({ budget, categoryTotal, linkedTransactions, linkedStats })
})

/* ─────────────────────────── Transactions (CRUD) ───────────────────────────
 * Toutes scopées session. Écriture : appartenance vérifiée EXPLICITEMENT (SELECT
 * via getTransactionById → 404) avant update/delete, + appartenance du compte /
 * de la catégorie / du compte de transfert. Le client envoie une MAGNITUDE
 * positive ; le serveur dérive le signe (Revenu → +, sinon −). Entier FCFA.
 * NB : les stats (Entrées/Sorties/Net) viennent de SUM(transactions) sur les
 * lignes réelles — elles diffèrent volontairement des KPI dashboard (summaries
 * de présentation). Mutation → invalide la liste ET le dashboard côté front,
 * mais le dashboard réaffiche les mêmes chiffres (agrégats non encore dérivés —
 * dette « dérivation des agrégats », tranchée plus tard, cf. façade Phase 3). */

const TXN_TYPES = ['Dépense', 'Revenu', 'Transfert', 'Récurrente']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const intParam = (v?: string): number | undefined => {
  const n = v != null ? Number(v) : NaN
  return Number.isInteger(n) && n >= 0 ? n : undefined
}

/** Valide + dérive le signe + vérifie l'appartenance. → input signé ou message. */
async function parseTxnInput(
  userId: string,
  body: unknown,
): Promise<{ input: TransactionWriteInput } | { error: string }> {
  if (typeof body !== 'object' || body === null) return { error: 'Corps de requête invalide.' }
  const b = body as Record<string, unknown>

  const type = b.type
  if (typeof type !== 'string' || !TXN_TYPES.includes(type)) return { error: 'Type invalide.' }

  const label = typeof b.label === 'string' ? b.label.trim() : ''
  if (!label) return { error: 'Libellé requis.' }

  const note =
    b.note == null ? null : typeof b.note === 'string' ? b.note.trim() || null : null

  const magnitude = b.amount
  if (typeof magnitude !== 'number' || !Number.isInteger(magnitude) || magnitude <= 0)
    return { error: 'Montant : entier FCFA strictement positif requis.' }

  const occurredAt = b.occurredAt
  if (typeof occurredAt !== 'string' || !ISO_DATE.test(occurredAt))
    return { error: 'Date invalide (AAAA-MM-JJ).' }

  const accountId = b.accountId
  if (typeof accountId !== 'string' || !(await userOwnsAccount(userId, accountId)))
    return { error: 'Compte invalide ou non autorisé.' }

  let categoryId: string | null = null
  if (b.categoryId != null) {
    if (typeof b.categoryId !== 'string' || !(await userOwnsCategory(userId, b.categoryId)))
      return { error: 'Catégorie invalide ou non autorisée.' }
    categoryId = b.categoryId
  }

  let transferAccountId: string | null = null
  if (type === 'Transfert') {
    const t = b.transferAccountId
    if (typeof t !== 'string' || !(await userOwnsAccount(userId, t)))
      return { error: 'Compte de transfert invalide ou non autorisé.' }
    if (t === accountId) return { error: 'Le compte de transfert doit différer du compte source.' }
    transferAccountId = t
  }

  // Signe dérivé du type : seul Revenu est positif.
  const amount = type === 'Revenu' ? magnitude : -magnitude
  return { input: { type, label, note, amount, accountId, categoryId, transferAccountId, occurredAt } }
}

// Listes de référence (sélecteurs du formulaire). Scopées.
api.get('/accounts', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  return c.json({ accounts: await listAccounts(userId) })
})
api.get('/categories', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  return c.json({ categories: await listCategories(userId) })
})

// Liste filtrée + stats d'en-tête.
api.get('/transactions', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const q = c.req.query()
  const filter: TransactionFilter = {
    type: q.type || undefined,
    accountId: q.accountId || undefined,
    categoryId: q.categoryId || undefined,
    from: q.from || undefined,
    to: q.to || undefined,
    search: q.q || undefined,
    limit: intParam(q.limit),
    offset: intParam(q.offset),
  }
  const [rows, stats] = await Promise.all([
    listTransactionsDetailed(userId, filter),
    getTransactionStats(userId, filter),
  ])
  return c.json({ transactions: rows, stats })
})

// Détail (lecture).
api.get('/transactions/:id', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const txn = await getTransactionById(userId, c.req.param('id'))
  if (!txn) return c.json({ error: 'not found' }, 404)
  return c.json({ transaction: txn })
})

// Création.
api.post('/transactions', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const body: unknown = await c.req.json().catch(() => null)
  const parsed = await parseTxnInput(userId, body)
  if ('error' in parsed) return c.json({ error: parsed.error }, 400)
  const [created] = await createTransaction(userId, parsed.input)
  return c.json({ transaction: created }, 201)
})

// Édition (PATCH = remplacement complet du formulaire). Appartenance → 404.
api.patch('/transactions/:id', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const id = c.req.param('id')
  const existing = await getTransactionById(userId, id)
  if (!existing) return c.json({ error: 'not found' }, 404)
  const body: unknown = await c.req.json().catch(() => null)
  const parsed = await parseTxnInput(userId, body)
  if ('error' in parsed) return c.json({ error: parsed.error }, 400)
  const [updated] = await updateTransaction(userId, id, parsed.input)
  return c.json({ transaction: updated })
})

// Suppression. Appartenance → 404.
api.delete('/transactions/:id', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const id = c.req.param('id')
  const existing = await getTransactionById(userId, id)
  if (!existing) return c.json({ error: 'not found' }, 404)
  await deleteTransaction(userId, id)
  return c.json({ status: 'ok' })
})

/* ───────────────────────────────── Objectifs ───────────────────────────────
 * Lecture (liste + détail avec historique) + ajout de contribution. Scopées session.
 * Une contribution incrémente goals.current_amount de façon ATOMIQUE (et ne touche
 * PAS le solde du compte source — dette assumée Phase 7, cf. createContribution).
 * La CRÉATION / ÉDITION d'objectif est DIFFÉRÉE (target_date/target_amount modélisés
 * et lus, mais leur saisie exige un écran absent du wireframe — non inventé ici). */

// Jour de référence produit (currentDate) — borne le statut « En retard ».
const TODAY = '2026-06-01'

type GoalStatus = 'Atteint' | 'En retard' | 'En cours'
/** pct/reste/statut d'un objectif — dérivés (current_amount stocké fait foi). */
function goalMeta(g: { currentAmount: number; targetAmount: number; targetDate: string | null }): {
  pct: number
  reste: number
  status: GoalStatus
} {
  const pct = g.targetAmount ? Math.floor((g.currentAmount / g.targetAmount) * 100) : 0
  const reste = Math.max(0, g.targetAmount - g.currentAmount)
  const status: GoalStatus =
    pct >= 100 ? 'Atteint' : g.targetDate && g.targetDate < TODAY ? 'En retard' : 'En cours'
  return { pct, reste, status }
}

/** Valide une contribution + vérifie l'appartenance du compte source. */
async function parseContributionInput(
  userId: string,
  goalId: string,
  body: unknown,
): Promise<{ input: Parameters<typeof createContribution>[1] } | { error: string }> {
  if (typeof body !== 'object' || body === null) return { error: 'Corps de requête invalide.' }
  const b = body as Record<string, unknown>

  const amount = b.amount
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0)
    return { error: 'Montant : entier FCFA strictement positif requis.' }

  const occurredAt = b.occurredAt
  if (typeof occurredAt !== 'string' || !ISO_DATE.test(occurredAt))
    return { error: 'Date invalide (AAAA-MM-JJ).' }

  // Compte source : optionnel mais, si fourni, doit appartenir au user.
  let accountId: string | null = null
  if (b.accountId != null && b.accountId !== '') {
    if (typeof b.accountId !== 'string' || !(await userOwnsAccount(userId, b.accountId)))
      return { error: 'Compte invalide ou non autorisé.' }
    accountId = b.accountId
  }
  return { input: { goalId, accountId, amount, occurredAt } }
}

// Liste des objectifs (pct/reste/statut dérivés).
api.get('/goals', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const rows = await listGoals(userId)
  const goals = rows.map((g) => ({
    id: g.id,
    name: g.name,
    currentAmount: g.currentAmount,
    targetAmount: g.targetAmount,
    targetDate: g.targetDate,
    ...goalMeta(g),
  }))
  return c.json({ goals })
})

// Détail : objectif + historique des contributions. Appartenance → 404.
api.get('/goals/:id', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const g = await getGoalById(userId, c.req.param('id'))
  if (!g) return c.json({ error: 'not found' }, 404)
  const [contributions] = await Promise.all([listContributions(userId, g.id)])
  const goal = {
    id: g.id,
    name: g.name,
    currentAmount: g.currentAmount,
    targetAmount: g.targetAmount,
    targetDate: g.targetDate,
    ...goalMeta(g),
  }
  return c.json({ goal, contributions })
})

// Ajout d'une contribution : crée la ligne ET fait progresser l'objectif (atomique).
api.post('/goals/:id/contributions', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const goalId = c.req.param('id')
  const goal = await getGoalById(userId, goalId)
  if (!goal) return c.json({ error: 'not found' }, 404)
  const body: unknown = await c.req.json().catch(() => null)
  const parsed = await parseContributionInput(userId, goalId, body)
  if ('error' in parsed) return c.json({ error: parsed.error }, 400)
  const { contribution, goal: updated } = await createContribution(userId, parsed.input)
  return c.json({ contribution, goal: { ...updated, ...goalMeta(updated) } }, 201)
})

app.route('/api', api)

const port = Number(process.env.PORT ?? 8787)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Hono prêt sur http://localhost:${info.port}`)
})
