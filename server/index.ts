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

app.route('/api', api)

const port = Number(process.env.PORT ?? 8787)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Hono prêt sur http://localhost:${info.port}`)
})
