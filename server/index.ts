import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { client, db } from './db/client'
import { user } from './db/auth-schema'
import { auth } from './auth'
import { getSessionUserId } from './session'
import {
  askClaude,
  type ChatMessage,
  type FinancialContext,
  type BudgetTarget,
  type GoalTarget,
  type ForecastTarget,
  type AnomalyInput,
  type AnomalyCandidate,
  type RecurringCandidate,
} from './ai'
import {
  getMonthlySummary,
  getCategoryBreakdown,
  getCategoryTxnCounts,
  listMonthlySummaries,
  listAccounts,
  listCategories,
  listBudgets,
  listArchivedBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  setBudgetArchived,
  type BudgetWriteInput,
  getAccountById,
  createAccount,
  updateAccount,
  setAccountBlocked,
  computeAccountBalances,
  computeNetWorth,
  type AccountWriteInput,
  listGoals,
  listContributions,
  getGoalById,
  createGoal,
  updateGoal,
  setGoalArchived,
  countGoalContributions,
  deleteGoal,
  type GoalWriteInput,
  createContribution,
  listLoans,
  getLoanWithSchedule,
  listNotifications,
  getNotificationById,
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  listTransactions,
  listTransactionsDetailed,
  getTransactionStats,
  getTransactionById,
  userOwnsAccount,
  userOwnsCategory,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  listRecurrences,
  getRecurrenceById,
  createRecurrence,
  updateRecurrence,
  deleteRecurrence,
  type TransactionFilter,
  type TransactionWriteInput,
  type RecurrenceWriteInput,
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

const BUDGET_FREQUENCIES = ['Hebdo', 'Mensuel', 'Annuel']
const BUDGET_ALERT_PCTS = [80, 90, 100]

/** Valide un budget (création/édition). `period` ajouté côté route. → input ou message. */
async function parseBudgetInput(
  userId: string,
  body: unknown,
): Promise<{ input: Omit<BudgetWriteInput, 'period'> } | { error: string }> {
  if (typeof body !== 'object' || body === null) return { error: 'Corps de requête invalide.' }
  const b = body as Record<string, unknown>

  const categoryId = b.categoryId
  if (typeof categoryId !== 'string' || !(await userOwnsCategory(userId, categoryId)))
    return { error: 'Catégorie invalide ou non autorisée.' }

  const cap = b.cap
  if (typeof cap !== 'number' || !Number.isInteger(cap) || cap <= 0)
    return { error: 'Plafond : entier FCFA strictement positif requis.' }

  const frequency = b.frequency
  if (typeof frequency !== 'string' || !BUDGET_FREQUENCIES.includes(frequency))
    return { error: 'Période invalide.' }

  const alertPct = b.alertPct
  if (typeof alertPct !== 'number' || !BUDGET_ALERT_PCTS.includes(alertPct))
    return { error: 'Seuil d’alerte invalide.' }

  if (typeof b.rollover !== 'boolean') return { error: 'Report invalide.' }

  return { input: { categoryId, cap, frequency, alertPct, rollover: b.rollover } }
}

/**
 * Valide la saisie d'un objectif (création / édition). Champs modélisés du wireframe
 * « Nouvel objectif » : nom, montant cible, déjà épargné, date cible. (« Compte dédié » et
 * « Contribution automatique » sont décoratifs côté wireframe — non persistés ici.)
 * Le wireframe ne montre PAS de priorité → aucune priorité inventée.
 */
function parseGoalInput(body: unknown): { input: GoalWriteInput } | { error: string } {
  if (typeof body !== 'object' || body === null) return { error: 'Corps de requête invalide.' }
  const b = body as Record<string, unknown>

  const name = typeof b.name === 'string' ? b.name.trim() : ''
  if (!name) return { error: 'Nom de l’objectif requis.' }

  const targetAmount = b.targetAmount
  if (typeof targetAmount !== 'number' || !Number.isInteger(targetAmount) || targetAmount <= 0)
    return { error: 'Montant cible : entier FCFA strictement positif requis.' }

  // « Déjà épargné » : optionnel, entier ≥ 0 (0 par défaut). Posé à la création seulement.
  let currentAmount = 0
  if (b.currentAmount != null) {
    if (typeof b.currentAmount !== 'number' || !Number.isInteger(b.currentAmount) || b.currentAmount < 0)
      return { error: 'Déjà épargné : entier FCFA positif ou nul requis.' }
    currentAmount = b.currentAmount
  }

  // Date cible : optionnelle (null si non fournie) ; sinon AAAA-MM-JJ stricte.
  let targetDate: string | null = null
  if (b.targetDate != null && b.targetDate !== '') {
    if (typeof b.targetDate !== 'string' || !ISO_DATE.test(b.targetDate))
      return { error: 'Date cible invalide (AAAA-MM-JJ).' }
    targetDate = b.targetDate
  }

  return { input: { name, targetAmount, currentAmount, targetDate } }
}

/** Delta % m/m signé à une décimale, format « +5,5 % » (miroir de ai.ts deltaPct). */
function deltaPctLabel(now: number, before: number): string {
  const d = Math.round(((now - before) / before) * 1000) / 10
  return `${d >= 0 ? '+' : '−'}${Math.abs(d).toString().replace('.', ',')} %`
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

  const [accountsRows, summary, months, breakdown, budgetRows, goalRows, recent, cats, notifs, loanRows, balances] =
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
      computeAccountBalances(userId),
    ])

  // « Solde total » = Σ soldes COURANTS dérivés (Modèle B). Bouge à chaque mouvement.
  let total = 0
  for (const v of balances.values()) total += v
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

  // Solde d'un compte bloqué masqué AUSSI ici (cohérence : jamais en clair). Soldes
  // courants DÉRIVÉS (Modèle B) ; le KPI « Solde total » = Σ de ces dérivés.
  const accounts = accountsRows.map((a) => maskAccount(a, balances.get(a.id) ?? 0))

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

/* ───────────────────────────────── Analytics ───────────────────────────────
 * Écran d'analyse (Phase 10). Un SEUL payload scopé, composé EXCLUSIVEMENT de la
 * façade (mêmes dérivations que le dashboard et l'écran Budgets) → chaque chiffre
 * Analytics == dashboard == budgets par construction. Aucun agrégat nouveau non
 * dérivé : seul `getCategoryTxnCounts` (COUNT scoped du ledger) s'ajoute, réclamé
 * par la colonne « N opér. ». ?month=YYYY-MM (défaut DEMO_MONTH).
 *
 * Deltas MoM = RÉELS (mois courant vs précédent de la série) ; `null` si pas de M-1.
 * Pas de trend PAR CATÉGORIE (aucun snapshot de catégorie passé → non dérivable :
 * on ne l'invente pas). Les moyennes (onglet Tendances) sont la moyenne de la série,
 * sans delta (aucune mesure naturelle → pas de badge inventé). */
api.get('/analytics', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const month = c.req.query('month') ?? DEMO_MONTH

  const [months, breakdown, counts, budgetRows] = await Promise.all([
    listMonthlySummaries(userId), // série chrono ; mois courant DÉRIVÉ du ledger
    getCategoryBreakdown(userId, month),
    getCategoryTxnCounts(userId, month),
    listBudgets(userId, month),
  ])

  // Taux d'épargne PRÉCIS (épargne / revenus, en %) — base des KPI et deltas.
  const rate = (epargne: number, revenus: number) => (revenus ? (epargne / revenus) * 100 : 0)

  // Mois courant + précédent dans la série (pour les deltas MoM réels).
  const idx = months.findIndex((m) => m.month === month)
  const cur = idx >= 0 ? months[idx] : null
  const prev = idx > 0 ? months[idx - 1] : null

  const depenses = cur?.depenses ?? 0
  const revenus = cur?.revenus ?? 0
  const epargne = cur?.epargne ?? 0
  const savingsRate = Math.round(rate(epargne, revenus)) // 238 000/850 000 → 28

  // Delta % m/m à une décimale (recopie le format wireframe « +5,5 % »). null si pas de M-1.
  const deltaPct = (now: number, before: number) =>
    before ? Math.round(((now - before) / before) * 1000) / 10 : null

  const kpis = {
    depenses,
    revenus,
    epargne,
    savingsRate,
    depensesDeltaPct: prev ? deltaPct(depenses, prev.depenses ?? 0) : null,
    revenusDeltaPct: prev ? deltaPct(revenus, prev.revenus ?? 0) : null,
    // Écart en POINTS de taux (taux courant − taux M-1), une décimale. Taux non arrondis.
    savingsRateDeltaPts: prev
      ? Math.round((rate(epargne, revenus) - rate(prev.epargne ?? 0, prev.revenus ?? 0)) * 10) / 10
      : null,
  }

  // Moyennes de la série (onglet Tendances). Taux moyen = ratio des moyennes
  // (cohérent avec le calcul du taux courant), pas la moyenne des taux.
  const n = months.length || 1
  const revenusAvg = Math.round(months.reduce((s, m) => s + (m.revenus ?? 0), 0) / n)
  const depensesAvg = Math.round(months.reduce((s, m) => s + (m.depenses ?? 0), 0) / n)
  const epargneAvg = Math.round(months.reduce((s, m) => s + (m.epargne ?? 0), 0) / n)
  const averages = {
    revenusAvg,
    depensesAvg,
    epargneAvg,
    savingsRateAvg: Math.round(rate(epargneAvg, revenusAvg)),
  }

  const cashflow = months.map((m) => ({ m: m.month, rev: m.revenus, dep: m.depenses, epa: m.epargne }))

  // « N opér. » par catégorie (dérivé) ; absent = 0.
  const countByCat = new Map(counts.map((r) => [r.categoryId, r.txnCount]))
  const breakdownOut = breakdown.map((b) => ({
    categoryId: b.categoryId,
    name: b.name,
    colorToken: b.colorToken,
    amount: b.amount,
    v: depenses ? Math.round((b.amount / depenses) * 100) : 0, // même % que le donut dashboard
    txnCount: countByCat.get(b.categoryId) ?? 0,
  }))

  // Budget vs réel = MÊME mesure que l'écran Budgets (enveloppe stockée + budgetMeta).
  const bRows = budgetRows.map((b) => {
    const { pct, tone } = budgetMeta(b.spent, b.cap)
    return {
      categoryId: b.categoryId,
      categoryName: b.categoryName,
      colorToken: b.colorToken,
      cap: b.cap,
      spent: b.spent,
      pct,
      tone,
      ecart: b.spent - b.cap,
      txnCount: b.txnCount,
    }
  })
  const totalCap = bRows.reduce((s, b) => s + b.cap, 0)
  const totalSpent = bRows.reduce((s, b) => s + b.spent, 0)
  const budgets = {
    rows: bRows,
    totals: {
      cap: totalCap,
      spent: totalSpent,
      ecart: totalSpent - totalCap,
      tauxConso: budgetMeta(totalSpent, totalCap).pct,
    },
  }

  return c.json({ period: month, kpis, averages, cashflow, breakdown: breakdownOut, budgets })
})

/* ───────────────────────────────── Notifications ───────────────────────────
 * Centre de notifications (Phase 11). Chaque notif porte un deep-link contextuel
 * résolu CÔTÉ SERVEUR en `href` depuis (link_type, link_id) — le front rend la
 * ligne cliquable si `href` non-null. Les colonnes link_* ne sont PAS exposées
 * brutes. Lecture/écriture scopées session ; PATCH vérifie l'appartenance (→ 404).
 * `unreadCount` accompagne chaque réponse (badge cloche du shell). */

// (link_type, link_id) → href applicatif. null = notif informative (non cliquable).
function notifHref(linkType: string | null, linkId: string | null): string | null {
  switch (linkType) {
    case 'budget':
      return linkId ? `/budgets/${linkId}` : null
    case 'goal':
      return linkId ? `/objectifs/${linkId}` : null
    case 'account':
      return linkId ? `/comptes/${linkId}` : null
    case 'loan':
      return '/pret'
    case 'analytics':
      return '/analytics'
    case 'transactions':
      // link_id = categoryId → liste filtrée sur le mois de réf. ; sinon liste brute.
      return linkId
        ? `/transactions?categoryId=${linkId}&from=${DEMO_MONTH}-01&to=${DEMO_MONTH}-31`
        : '/transactions'
    default:
      return null
  }
}

// Projection publique d'une notification (href résolu, link_* masqués).
function projectNotification(n: {
  id: string
  title: string
  body: string
  tone: string | null
  icon: string
  read: boolean
  linkType: string | null
  linkId: string | null
  createdAt: Date
}) {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    tone: n.tone,
    icon: n.icon,
    read: n.read,
    href: notifHref(n.linkType, n.linkId),
    createdAt: n.createdAt,
  }
}

// Liste des notifications du user + compteur de non-lues.
api.get('/notifications', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const [rows, unreadCount] = await Promise.all([
    listNotifications(userId),
    countUnreadNotifications(userId),
  ])
  return c.json({ notifications: rows.map(projectNotification), unreadCount })
})

// Marque UNE notification (du user) comme lue. Appartenance vérifiée → 404.
api.patch('/notifications/:id', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const existing = await getNotificationById(userId, c.req.param('id'))
  if (!existing) return c.json({ error: 'not found' }, 404)
  const [updated] = await markNotificationRead(userId, existing.id)
  const unreadCount = await countUnreadNotifications(userId)
  return c.json({ notification: projectNotification(updated), unreadCount })
})

// « Tout marquer comme lu » : passe toutes les non-lues du user à lu.
api.post('/notifications/read-all', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  await markAllNotificationsRead(userId)
  return c.json({ status: 'ok', unreadCount: 0 })
})

/* ───────────────────────────────── Assistant IA ────────────────────────────
 * Chat de l'assistant financier (Phase 12, sous-bloc 1). La route LIT le contexte
 * financier scopé (façade, mêmes agrégats que /api/dashboard → chiffres cohérents)
 * et le passe à `askClaude` (STUB déterministe pour l'instant ; clé Anthropic
 * SERVEUR plus tard, jamais côté client). SUGGESTION ONLY (§1.6) : la réponse est
 * du TEXTE (+ barres lecture seule) ; le contexte ne porte aucun id/handle d'action,
 * la route n'écrit rien → l'assistant ne peut RIEN déclencher. */

// Valide l'historique reçu (format Anthropic). Renvoie les messages ou une erreur.
function parseChatMessages(body: unknown): { messages: ChatMessage[] } | { error: string } {
  if (typeof body !== 'object' || body === null || !('messages' in body)) {
    return { error: 'messages requis' }
  }
  const raw: unknown = body.messages
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: 'messages doit être un tableau non vide' }
  }
  const messages: ChatMessage[] = []
  for (const m of raw) {
    const role = (m as { role?: unknown }).role
    const content = (m as { content?: unknown }).content
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
      return { error: 'chaque message doit être { role: "user"|"assistant", content: string }' }
    }
    messages.push({ role, content })
  }
  if (messages[messages.length - 1].role !== 'user') {
    return { error: 'le dernier message doit être de l’utilisateur' }
  }
  return { messages }
}

// Compose le contexte financier scopé (LECTURE SEULE) — même façade que /api/dashboard,
// donc chiffres == dashboard/analytics/budgets. Partagé par /ai/chat et /ai/insights.
async function buildAiContext(userId: string): Promise<FinancialContext> {
  const [total, summary, months, breakdown, budgetRows, goalRows, loanRows] =
    await Promise.all([
      computeNetWorth(userId),
      getMonthlySummary(userId, DEMO_MONTH),
      listMonthlySummaries(userId),
      getCategoryBreakdown(userId, DEMO_MONTH),
      listBudgets(userId, DEMO_MONTH),
      listGoals(userId),
      listLoans(userId),
    ])
  const depenses = summary?.depenses ?? null
  const revenus = summary?.revenus ?? null
  const epargne = summary?.epargne ?? null
  const savingsRate = revenus && epargne != null ? Math.round((epargne / revenus) * 100) : null
  // Dépenses du mois précédent (tendance M/M) depuis la série mensuelle.
  const idx = months.findIndex((m) => m.month === DEMO_MONTH)
  const depensesPrev = idx > 0 ? (months[idx - 1].depenses ?? null) : null

  return {
    month: DEMO_MONTH,
    total,
    revenus,
    depenses,
    depensesPrev,
    epargne,
    savingsRate,
    topCategories: breakdown.map((b) => ({
      name: b.name,
      amount: b.amount,
      pct: depenses ? Math.round((b.amount / depenses) * 100) : 0,
      colorToken: b.colorToken,
    })),
    budgets: budgetRows.map((b) => ({
      id: b.id,
      name: b.categoryName,
      cap: b.cap,
      spent: b.spent,
      ...budgetMeta(b.spent, b.cap),
    })),
    goals: goalRows.map((g) => ({
      id: g.id,
      name: g.name,
      current: g.currentAmount,
      target: g.targetAmount,
      pct: g.targetAmount ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
    })),
    loans: loanRows.map((l) => ({
      name: l.name,
      remaining: l.remaining,
      monthlyPayment: l.monthlyPayment,
    })),
  }
}

api.post('/ai/chat', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const body: unknown = await c.req.json().catch(() => null)
  const parsed = parseChatMessages(body)
  if ('error' in parsed) return c.json({ error: parsed.error }, 400)
  const context = await buildAiContext(userId)
  const result = await askClaude({ messages: parsed.messages, context })
  return c.json(result)
})

// Insights du dashboard : liste structurée DÉRIVÉE du contexte (mêmes chiffres que le
// dashboard). askClaude(mode:'insights') = stub déterministe (même frontière Anthropic).
// SUGGESTION ONLY : chaque insight est du texte + un lien de NAVIGATION (jamais d'action).
api.get('/ai/insights', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const context = await buildAiContext(userId)
  const result = await askClaude({ mode: 'insights', context })
  return c.json(result)
})

// Conseil contextuel sur UN budget (détail). Appartenance vérifiée → 404. Cite les
// vrais chiffres (ecart/pct + dépense catégorie dérivée). SUGGESTION ONLY : texte +
// lien de navigation (jamais d'action). Réutilise buildAiContext + le budget ciblé.
api.get('/ai/budgets/:id/advice', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const b = await getBudgetById(userId, c.req.param('id'))
  if (!b) return c.json({ error: 'not found' }, 404)
  const { pct, tone } = budgetMeta(b.spent, b.cap)
  const [context, breakdown] = await Promise.all([
    buildAiContext(userId),
    getCategoryBreakdown(userId, b.period),
  ])
  const categoryTotal = breakdown.find((x) => x.categoryId === b.categoryId)?.amount ?? 0
  const budget: BudgetTarget = {
    name: b.categoryName,
    cap: b.cap,
    spent: b.spent,
    pct,
    tone,
    ecart: b.spent - b.cap,
    categoryTotal,
    transactionsHref: `/transactions?categoryId=${b.categoryId}&from=${b.period}-01&to=${b.period}-31`,
  }
  const advice = await askClaude({ mode: 'budget-advice', context, budget })
  return c.json(advice)
})

// Projection d'UN objectif (détail). Appartenance vérifiée → 404. PRÉVISION §1.6 :
// la sortie est TOUJOURS une estimation encadrée (horizon + confiance + base), jamais
// une certitude. Réutilise buildAiContext + l'objectif ciblé (reste/moyenne dérivés).
// SUGGESTION ONLY : texte/rythme, aucun champ exécutable.
api.get('/ai/goals/:id/projection', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const g = await getGoalById(userId, c.req.param('id'))
  if (!g) return c.json({ error: 'not found' }, 404)
  const [context, contributions] = await Promise.all([
    buildAiContext(userId),
    listContributions(userId, g.id),
  ])
  const reste = Math.max(0, g.targetAmount - g.currentAmount)
  const avg = contributions.length
    ? Math.round(contributions.reduce((s, ct) => s + ct.amount, 0) / contributions.length)
    : 0
  const goal: GoalTarget = {
    name: g.name,
    reste,
    avg,
    count: contributions.length,
    targetDate: g.targetDate,
    nowMonth: TODAY.slice(0, 7),
  }
  const projection = await askClaude({ mode: 'goal-projection', context, goal })
  return c.json(projection)
})

// Prévisions (onglet « Prévisions »). PRÉVISION §1.6 : chaque solde projeté est une
// ESTIMATION encadrée (horizon + confiance + base). Le solde net mensuel moyen et la
// tendance des dépenses sont DÉRIVÉS de la façade (mêmes chiffres que dashboard/analytics).
// SUGGESTION ONLY : texte + montants projetés, aucun champ exécutable.
api.get('/ai/forecasts', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const [context, netWorth, months] = await Promise.all([
    buildAiContext(userId),
    computeNetWorth(userId),
    listMonthlySummaries(userId),
  ])
  // Solde net mensuel moyen sur les mois COMPLETS (revenus + dépenses non nuls).
  const complete = months.filter((m) => m.revenus != null && m.depenses != null)
  const monthlyNet = complete.length
    ? Math.round(complete.reduce((s, m) => s + (m.revenus! - m.depenses!), 0) / complete.length)
    : 0
  // Tendance des dépenses M/M (réelle) pour projeter le risque budget.
  const expenseTrend =
    context.depenses != null && context.depensesPrev && context.depensesPrev > 0
      ? context.depenses / context.depensesPrev
      : null
  const trendLabel =
    context.depenses != null && context.depensesPrev != null && context.depensesPrev > 0
      ? deltaPctLabel(context.depenses, context.depensesPrev)
      : null
  const forecast: ForecastTarget = {
    current: netWorth,
    monthlyNet,
    monthsCount: complete.length,
    expenseTrend,
    trendLabel,
    budgets: context.budgets.map((b) => ({ name: b.name, pct: b.pct })),
  }
  const result = await askClaude({ mode: 'forecasts', context, forecast })
  return c.json(result)
})

// Anomalies (onglet « Anomalies »). §1.6 : chaque anomalie est EXPLIQUÉE par comparaison
// à l'historique de sa catégorie (référence = moyenne des AUTRES dépenses de la catégorie),
// pas une alerte sèche. SEULEMENT les écarts réellement dérivables du ledger ; aucune
// anomalie inventée (liste vide → écran « rien à signaler »). Récurrences = paiements
// marqués « Récurrente » (fait stocké). SUGGESTION ONLY : aucun champ exécutable.
api.get('/ai/anomalies', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const from = `${DEMO_MONTH}-01`
  const to = `${DEMO_MONTH}-31`
  const [context, txns] = await Promise.all([
    buildAiContext(userId),
    listTransactionsDetailed(userId, { from, to, limit: 500 }),
  ])

  // Dépenses du mois groupées par catégorie (transferts exclus : ni revenu ni dépense).
  const expenses = txns.filter((t) => t.type !== 'Transfert' && t.amount < 0)
  const byCat = new Map<string, typeof expenses>()
  for (const t of expenses) {
    const key = t.categoryName ?? '—'
    const arr = byCat.get(key) ?? []
    arr.push(t)
    byCat.set(key, arr)
  }

  // Anomalie = dépense dont le montant s'écarte nettement du profil de SA catégorie.
  // Seuils : catégorie d'au moins 3 dépenses (moyenne signifiante), |montant| ≥ 20 000,
  // ratio ≥ 2,5× la moyenne des AUTRES dépenses de la catégorie. Rien d'inventé.
  const candidates: AnomalyCandidate[] = []
  for (const [category, rows] of byCat) {
    if (rows.length < 3) continue
    const total = rows.reduce((s, t) => s + Math.abs(t.amount), 0)
    for (const t of rows) {
      const amt = Math.abs(t.amount)
      const others = rows.length - 1
      const categoryAvg = Math.round((total - amt) / others)
      if (categoryAvg <= 0) continue
      const ratio = amt / categoryAvg
      if (amt >= 20000 && ratio >= 2.5) {
        candidates.push({
          label: t.label,
          category,
          amount: t.amount,
          when: t.occurredAt,
          categoryAvg,
          ratio,
          // Lien de NAVIGATION vers les opérations de la catégorie (jamais d'action).
          href: t.categoryId
            ? `/transactions?categoryId=${t.categoryId}&from=${from}&to=${to}`
            : '/transactions',
        })
      }
    }
  }

  // Récurrences = paiements marqués « Récurrente » dans le ledger (fait stocké).
  const recurring: RecurringCandidate[] = txns
    .filter((t) => t.type === 'Récurrente')
    .map((t) => ({ label: t.label, category: t.categoryName ?? '—', amount: t.amount }))

  const input: AnomalyInput = { month: DEMO_MONTH, candidates, recurring }
  const result = await askClaude({ mode: 'anomalies', context, anomalies: input })
  return c.json(result)
})

/* ───────────────────────────────── Budgets ─────────────────────────────────
 * Lecture seule (Phase 6). pct/tone via budgetMeta (même logique que le dashboard).
 * Le DÉTAIL expose DEUX mesures du même mois, distinctes par construction :
 *  - budget.spent : enveloppe budgétée, STOCKÉE (ne bouge pas aux mutations) ;
 *  - categoryTotal : dépense TOTALE de la catégorie, DÉRIVÉE du ledger via la façade
 *    getCategoryBreakdown (bouge aux mutations). Pour Transport : 54 000 vs 116 000.
 * Scopées session ; le détail vérifie l'appartenance (getBudgetById → 404). */

// Liste des budgets de la période + résumé d'en-tête. `?archived=true` → onglet « Archivés ».
api.get('/budgets', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  if (c.req.query('archived') === 'true') {
    const rows = await listArchivedBudgets(userId)
    const archived = rows.map((b) => ({ ...b, ...budgetMeta(b.spent, b.cap), ecart: b.spent - b.cap }))
    return c.json({ budgets: archived })
  }
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

/* ───────────── Écritures budgets (création / ajustement / archivage) ─────────────
 * Scopées session + appartenance (SELECT → 404). Plafond entier FCFA > 0, catégorie
 * POSSÉDÉE vérifiée. `spent` (enveloppe stockée, distinction Phase 6) n'est PAS touché
 * par ces écritures : un budget neuf démarre à spent = 0. */

// Création. Période = mois de démo (le budget s'applique au mois courant).
api.post('/budgets', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const body: unknown = await c.req.json().catch(() => null)
  const parsed = await parseBudgetInput(userId, body)
  if ('error' in parsed) return c.json({ error: parsed.error }, 400)
  // `spent` NEUF = dépenses RÉELLES de la catégorie ce mois (dérivé du ledger), pour
  // refléter le consommé existant (≠ 0 % trompeur). Snapshot stocké ensuite (cf.
  // createBudget : seedé = enveloppe stockée / neuf = dérivé à la création).
  const breakdown = await getCategoryBreakdown(userId, DEMO_MONTH)
  const spent = breakdown.find((x) => x.categoryId === parsed.input.categoryId)?.amount ?? 0
  const [created] = await createBudget(userId, { ...parsed.input, period: DEMO_MONTH }, spent)
  return c.json({ budget: { ...created, ...budgetMeta(created.spent, created.cap) } }, 201)
})

// Ajustement du plafond + réglages. Appartenance → 404. (Catégorie/période inchangées.)
api.patch('/budgets/:id', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const id = c.req.param('id')
  const existing = await getBudgetById(userId, id)
  if (!existing) return c.json({ error: 'not found' }, 404)
  const body: unknown = await c.req.json().catch(() => null)
  const parsed = await parseBudgetInput(userId, body)
  if ('error' in parsed) return c.json({ error: parsed.error }, 400)
  const { cap, frequency, alertPct, rollover } = parsed.input
  const [updated] = await updateBudget(userId, id, { cap, frequency, alertPct, rollover })
  return c.json({ budget: { ...updated, ...budgetMeta(updated.spent, updated.cap) } })
})

// Archivage. Appartenance → 404.
api.post('/budgets/:id/archive', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const existing = await getBudgetById(userId, c.req.param('id'))
  if (!existing) return c.json({ error: 'not found' }, 404)
  const [updated] = await setBudgetArchived(userId, existing.id, true)
  return c.json({ budget: { ...updated, ...budgetMeta(updated.spent, updated.cap) } })
})

// Réactivation. Appartenance → 404.
api.post('/budgets/:id/unarchive', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const existing = await getBudgetById(userId, c.req.param('id'))
  if (!existing) return c.json({ error: 'not found' }, 404)
  const [updated] = await setBudgetArchived(userId, existing.id, false)
  return c.json({ budget: { ...updated, ...budgetMeta(updated.spent, updated.cap) } })
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

// Seule fréquence livrée (cf. wireframe « Chaque mois, le 1er ») — on rejette le
// reste pour ne pas exposer d'option fantôme côté front.
const RECURRENCE_FREQUENCIES = ['monthly']

/** Valide une récurrence + dérive le signe (charge → négatif) + vérifie l'appartenance. */
async function parseRecurrenceInput(
  userId: string,
  body: unknown,
): Promise<{ input: RecurrenceWriteInput } | { error: string }> {
  if (typeof body !== 'object' || body === null) return { error: 'Corps de requête invalide.' }
  const b = body as Record<string, unknown>

  const name = typeof b.name === 'string' ? b.name.trim() : ''
  if (!name) return { error: 'Libellé requis.' }

  const magnitude = b.amount
  if (typeof magnitude !== 'number' || !Number.isInteger(magnitude) || magnitude <= 0)
    return { error: 'Montant : entier FCFA strictement positif requis.' }

  const frequency = b.frequency
  if (typeof frequency !== 'string' || !RECURRENCE_FREQUENCIES.includes(frequency))
    return { error: 'Fréquence invalide.' }

  const nextDate = b.nextDate
  if (typeof nextDate !== 'string' || !ISO_DATE.test(nextDate))
    return { error: 'Prochaine date invalide (AAAA-MM-JJ).' }

  if (typeof b.known !== 'boolean') return { error: 'Statut invalide.' }
  const known = b.known

  let categoryId: string | null = null
  if (b.categoryId != null) {
    if (typeof b.categoryId !== 'string' || !(await userOwnsCategory(userId, b.categoryId)))
      return { error: 'Catégorie invalide ou non autorisée.' }
    categoryId = b.categoryId
  }

  let accountId: string | null = null
  if (b.accountId != null) {
    if (typeof b.accountId !== 'string' || !(await userOwnsAccount(userId, b.accountId)))
      return { error: 'Compte invalide ou non autorisé.' }
    accountId = b.accountId
  }

  // Charge récurrente → stockée négative (miroir de la convention Dépense).
  return { input: { name, amount: -magnitude, frequency, nextDate, known, categoryId, accountId } }
}

/**
 * Projection d'un compte vers le front. `derivedBalance` = solde COURANT dérivé
 * (Modèle B, via `computeAccountBalances`) — JAMAIS la colonne `balance` brute (= initial).
 * SÉCURITÉ : le solde d'un compte BLOQUÉ est calculé mais n'est JAMAIS sérialisé
 * (`balance: null`, masquage appliqué APRÈS le calcul) — le front rend « ••• ••• » à
 * partir du flag `blocked`. (CLAUDE.md : solde masqué.)
 */
type AccountRow = Awaited<ReturnType<typeof listAccounts>>[number]
function maskAccount(a: AccountRow, derivedBalance: number) {
  return {
    id: a.id,
    name: a.name,
    bank: a.bank,
    type: a.type,
    accountNumber: a.accountNumber,
    blocked: a.blocked,
    balance: a.blocked ? null : derivedBalance,
  }
}

// Types de compte canoniques (filtres liste = Trésorerie/Épargne/Mobile money ;
// « Espèces » = cash, sans onglet dédié). Rejette tout le reste (pas de type fantôme).
const ACCOUNT_TYPES = ['Trésorerie', 'Épargne', 'Mobile money', 'Espèces']

/** Valide les données d'un compte (création/édition). → input ou message. */
function parseAccountInput(body: unknown): { input: AccountWriteInput } | { error: string } {
  if (typeof body !== 'object' || body === null) return { error: 'Corps de requête invalide.' }
  const b = body as Record<string, unknown>

  const name = typeof b.name === 'string' ? b.name.trim() : ''
  if (!name) return { error: 'Nom du compte requis.' }

  const type = b.type
  if (typeof type !== 'string' || !ACCOUNT_TYPES.includes(type))
    return { error: 'Type de compte invalide.' }

  const bank = typeof b.bank === 'string' ? b.bank.trim() : ''
  const accountNumber = typeof b.accountNumber === 'string' ? b.accountNumber.trim() : ''

  const balance = b.balance
  if (typeof balance !== 'number' || !Number.isInteger(balance) || balance < 0)
    return { error: 'Solde : entier FCFA positif ou nul requis.' }

  return { input: { name, bank, type, accountNumber, balance } }
}

// Liste des comptes (soldes bloqués masqués) + patrimoine agrégé serveur. Scopée.
// Sert AUSSI de liste de référence aux sélecteurs de formulaire (id/name).
api.get('/accounts', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const [rows, months, balances] = await Promise.all([
    listAccounts(userId),
    listMonthlySummaries(userId),
    computeAccountBalances(userId),
  ])
  // Patrimoine total = Σ des soldes COURANTS dérivés (incl. bloqué), calculé SERVEUR :
  // inclut Wave (fidèle au wireframe) sans jamais exposer son solde individuel. Un
  // transfert interne (−X source, +X dest) laisse ce total INCHANGÉ.
  let patrimoineTotal = 0
  for (const v of balances.values()) patrimoineTotal += v
  // Spark = épargne CUMULÉE des mois — proxy RÉEL de la TENDANCE du patrimoine (pas
  // les soldes absolus mensuels ; le vrai historique de solde = chantier dédié futur).
  let cum = 0
  const patrimoineSpark = months.map((m) => (cum += m.epargne ?? 0))
  return c.json({
    accounts: rows.map((a) => maskAccount(a, balances.get(a.id) ?? 0)),
    patrimoineTotal,
    patrimoineSpark,
  })
})
api.get('/categories', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  return c.json({ categories: await listCategories(userId) })
})

// Détail compte (solde bloqué masqué) + dernières opérations. Appartenance → 404.
api.get('/accounts/:id', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const a = await getAccountById(userId, c.req.param('id'))
  if (!a) return c.json({ error: 'not found' }, 404)
  const [recentTransactions, balances] = await Promise.all([
    listTransactionsDetailed(userId, { accountId: a.id, limit: 5 }),
    computeAccountBalances(userId),
  ])
  return c.json({ account: maskAccount(a, balances.get(a.id) ?? 0), recentTransactions })
})

/* ───────────── Écritures comptes (création / édition / blocage) ─────────────
 * Scopées session + appartenance (SELECT → 404). Solde entier FCFA. Le masquage
 * du solde bloqué (maskAccount) reste appliqué en sortie → cohérent après écriture.
 * Débloque le cold start : un nouvel utilisateur crée son 1er compte ici. */

// Création de compte.
api.post('/accounts', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const body: unknown = await c.req.json().catch(() => null)
  const parsed = parseAccountInput(body)
  if ('error' in parsed) return c.json({ error: parsed.error }, 400)
  // Compte neuf = aucun mouvement → solde courant dérivé == solde initial saisi.
  const [created] = await createAccount(userId, parsed.input)
  return c.json({ account: maskAccount(created, created.balance) }, 201)
})

// Édition. Appartenance → 404. RÉCONCILIATION (Modèle B, Q1) : la saisie « Solde
// actuel » = solde COURANT voulu → on stocke `initial = saisi − Σ(mouvements)` pour que
// le dérivé redevienne exactement la valeur saisie. (`initial` peut être négatif : point
// de calcul, jamais affiché tel quel.)
api.patch('/accounts/:id', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const id = c.req.param('id')
  const existing = await getAccountById(userId, id)
  if (!existing) return c.json({ error: 'not found' }, 404)
  const body: unknown = await c.req.json().catch(() => null)
  const parsed = parseAccountInput(body)
  if ('error' in parsed) return c.json({ error: parsed.error }, 400)
  const balances = await computeAccountBalances(userId)
  const movementSum = (balances.get(id) ?? existing.balance) - existing.balance
  const initialBalance = parsed.input.balance - movementSum
  const [updated] = await updateAccount(userId, id, { ...parsed.input, balance: initialBalance })
  // Dérivé après update = initialBalance + movementSum = solde saisi.
  return c.json({ account: maskAccount(updated, parsed.input.balance) })
})

// Blocage. Appartenance → 404. Le solde dérivé est calculé mais masqué en sortie.
api.post('/accounts/:id/block', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const existing = await getAccountById(userId, c.req.param('id'))
  if (!existing) return c.json({ error: 'not found' }, 404)
  const [updated] = await setAccountBlocked(userId, existing.id, true)
  const balances = await computeAccountBalances(userId)
  return c.json({ account: maskAccount(updated, balances.get(updated.id) ?? 0) })
})

// Déblocage. Appartenance → 404.
api.post('/accounts/:id/unblock', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const existing = await getAccountById(userId, c.req.param('id'))
  if (!existing) return c.json({ error: 'not found' }, 404)
  const [updated] = await setAccountBlocked(userId, existing.id, false)
  const balances = await computeAccountBalances(userId)
  return c.json({ account: maskAccount(updated, balances.get(updated.id) ?? 0) })
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

/* ──────────────────────────────── Récurrences ───────────────────────────────
 * CRUD de l'entité `recurrences` (charges qui reviennent). Scopées session +
 * appartenance (SELECT → 404 avant PATCH/DELETE), même patron que transactions.
 * Le client envoie une MAGNITUDE ; le serveur stocke le signe (charge → négatif). */

// Liste (triée par prochaine échéance).
api.get('/recurrences', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const rows = await listRecurrences(userId)
  return c.json({ recurrences: rows })
})

// Création.
api.post('/recurrences', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const body: unknown = await c.req.json().catch(() => null)
  const parsed = await parseRecurrenceInput(userId, body)
  if ('error' in parsed) return c.json({ error: parsed.error }, 400)
  const [created] = await createRecurrence(userId, parsed.input)
  return c.json({ recurrence: created }, 201)
})

// Édition (remplacement complet du formulaire). Appartenance → 404.
api.patch('/recurrences/:id', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const id = c.req.param('id')
  const existing = await getRecurrenceById(userId, id)
  if (!existing) return c.json({ error: 'not found' }, 404)
  const body: unknown = await c.req.json().catch(() => null)
  const parsed = await parseRecurrenceInput(userId, body)
  if ('error' in parsed) return c.json({ error: parsed.error }, 400)
  const [updated] = await updateRecurrence(userId, id, parsed.input)
  return c.json({ recurrence: updated })
})

// Suppression. Appartenance → 404.
api.delete('/recurrences/:id', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const id = c.req.param('id')
  const existing = await getRecurrenceById(userId, id)
  if (!existing) return c.json({ error: 'not found' }, 404)
  await deleteRecurrence(userId, id)
  return c.json({ status: 'ok' })
})

/* ───────────────────────────────── Objectifs ───────────────────────────────
 * Lecture (liste + détail avec historique) + ajout de contribution. Scopées session.
 * Une contribution incrémente goals.current_amount de façon ATOMIQUE (et ne touche
 * PAS le solde du compte source — dette assumée Phase 7, cf. createContribution).
 * CRÉATION / ÉDITION d'objectif : POST/PATCH /goals (drawer « Nouvel objectif » du
 * wireframe). La contribution reste le SEUL flux qui fait progresser current_amount. */

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

/* ───────────── Écritures objectifs (création / édition) ─────────────
 * Scopées session + appartenance (SELECT → 404). Le wireframe « Nouvel objectif » fixe
 * les champs ; la contribution (progression) reste un flux distinct, non touché ici. */

// Création. `currentAmount` (« Déjà épargné ») posé ici ; ensuite seul un versement le fait bouger.
api.post('/goals', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const body: unknown = await c.req.json().catch(() => null)
  const parsed = parseGoalInput(body)
  if ('error' in parsed) return c.json({ error: parsed.error }, 400)
  const [created] = await createGoal(userId, parsed.input)
  return c.json({ goal: { ...created, ...goalMeta(created) } }, 201)
})

// Édition (nom / cible / date). Appartenance → 404. `currentAmount` inchangé (piloté par versements).
api.patch('/goals/:id', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const existing = await getGoalById(userId, c.req.param('id'))
  if (!existing) return c.json({ error: 'not found' }, 404)
  const body: unknown = await c.req.json().catch(() => null)
  const parsed = parseGoalInput(body)
  if ('error' in parsed) return c.json({ error: parsed.error }, 400)
  const { name, targetAmount, targetDate } = parsed.input
  const [updated] = await updateGoal(userId, existing.id, { name, targetAmount, targetDate })
  return c.json({ goal: { ...updated, ...goalMeta(updated) } })
})

// Archivage (réversible) — un objectif contribué se retire de la liste sans perdre son
// historique. Appartenance → 404.
api.post('/goals/:id/archive', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const existing = await getGoalById(userId, c.req.param('id'))
  if (!existing) return c.json({ error: 'not found' }, 404)
  const [updated] = await setGoalArchived(userId, existing.id, true)
  return c.json({ goal: { ...updated, ...goalMeta(updated) } })
})

// Réactivation. Appartenance → 404. (Pas de vue archivés côté objectifs : usage API/futur.)
api.post('/goals/:id/unarchive', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const existing = await getGoalById(userId, c.req.param('id'))
  if (!existing) return c.json({ error: 'not found' }, 404)
  const [updated] = await setGoalArchived(userId, existing.id, false)
  return c.json({ goal: { ...updated, ...goalMeta(updated) } })
})

// Suppression DURE — autorisée UNIQUEMENT si l'objectif n'a AUCUNE contribution : on ne
// détruit jamais un historique de versements (un objectif contribué s'archive → 409).
// Appartenance → 404.
api.delete('/goals/:id', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const existing = await getGoalById(userId, c.req.param('id'))
  if (!existing) return c.json({ error: 'not found' }, 404)
  const count = await countGoalContributions(userId, existing.id)
  if (count > 0)
    return c.json(
      { error: 'Objectif avec contributions : archivez-le plutôt que de le supprimer.' },
      409,
    )
  await deleteGoal(userId, existing.id)
  return c.json({ ok: true })
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

/* ───────────────────────────── Prêts ──────────────────────────────────── */

type LoanRow = Awaited<ReturnType<typeof listLoans>>[number]

/** `2026-06` + k mois → `YYYY-MM` (déterministe, sans fuseau). */
function addMonthsIso(ym: string, k: number): string {
  const [y, m] = ym.split('-').map(Number)
  const t = y * 12 + (m - 1) + k
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`
}

/** Champs publics du prêt (sans userId/timestamps) + avancement (capital remboursé). */
function projectLoan(l: LoanRow) {
  const progress = l.principal ? Math.round(((l.principal - l.remaining) / l.principal) * 100) : 0
  return {
    id: l.id,
    name: l.name,
    principal: l.principal,
    remaining: l.remaining,
    rateBps: l.rateBps,
    monthlyPayment: l.monthlyPayment,
    termMonths: l.termMonths,
    monthsRemaining: l.monthsRemaining,
    nextDueDate: l.nextDueDate,
    progress,
  }
}

/** Stats de paiement dérivées (échéances payées/restantes, payé à ce jour, fin prévue). */
function loanStats(l: LoanRow) {
  const paidCount = l.termMonths - l.monthsRemaining
  return {
    paidCount,
    paidToDate: paidCount * l.monthlyPayment,
    remainingToPay: l.monthsRemaining * l.monthlyPayment,
    projectedEndMonth: l.nextDueDate
      ? addMonthsIso(l.nextDueDate.slice(0, 7), l.monthsRemaining - 1)
      : null,
  }
}

// Liste des prêts (avancement dérivé).
api.get('/loans', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const rows = await listLoans(userId)
  return c.json({ loans: rows.map(projectLoan) })
})

// Détail : prêt + échéancier + paiements + stats. Appartenance → 404.
api.get('/loans/:id', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const data = await getLoanWithSchedule(userId, c.req.param('id'))
  if (!data) return c.json({ error: 'not found' }, 404)
  return c.json({
    loan: projectLoan(data.loan),
    amortization: data.amortization,
    payments: data.payments,
    stats: loanStats(data.loan),
  })
})

app.route('/api', api)

const port = Number(process.env.PORT ?? 8787)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Hono prêt sur http://localhost:${info.port}`)
})
