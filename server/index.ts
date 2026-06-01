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
  listGoals,
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

  const toneOf = (pct: number) => (pct > 100 ? 'over' : pct >= 90 ? 'warn' : 'ok')
  const budgets = budgetRows
    .map((b) => {
      // floor : reproduit les % du wireframe (185 000/200 000 = 92,5 % → 92)
      const pct = b.cap ? Math.floor((b.spent / b.cap) * 100) : 0
      return { ...b, pct, tone: toneOf(pct) }
    })
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

app.route('/api', api)

const port = Number(process.env.PORT ?? 8787)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Hono prêt sur http://localhost:${info.port}`)
})
