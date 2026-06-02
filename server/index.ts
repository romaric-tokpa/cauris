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
  getCategoryTxnCounts,
  listMonthlySummaries,
  listAccounts,
  listCategories,
  listBudgets,
  getBudgetById,
  getAccountById,
  listGoals,
  listContributions,
  getGoalById,
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

  // Solde d'un compte bloqué masqué AUSSI ici (cohérence : jamais en clair). Le KPI
  // « Solde total » (`total`) reste l'agrégat serveur des soldes réels (incl. bloqué).
  const accounts = accountsRows.map(maskAccount)

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

/**
 * Projection d'un compte vers le front. SÉCURITÉ : le solde RÉEL d'un compte BLOQUÉ
 * n'est JAMAIS sérialisé (`balance: null`) — le front rend « ••• ••• » à partir du
 * flag `blocked`, jamais d'un masquage cosmétique. (CLAUDE.md : solde masqué.)
 */
type AccountRow = Awaited<ReturnType<typeof listAccounts>>[number]
function maskAccount(a: AccountRow) {
  return {
    id: a.id,
    name: a.name,
    bank: a.bank,
    type: a.type,
    accountNumber: a.accountNumber,
    blocked: a.blocked,
    balance: a.blocked ? null : a.balance,
  }
}

// Liste des comptes (soldes bloqués masqués) + patrimoine agrégé serveur. Scopée.
// Sert AUSSI de liste de référence aux sélecteurs de formulaire (id/name).
api.get('/accounts', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const [rows, months] = await Promise.all([listAccounts(userId), listMonthlySummaries(userId)])
  // Patrimoine total = Σ des soldes RÉELS (incl. bloqué), calculé SERVEUR : le total
  // inclut Wave (fidèle au wireframe) sans jamais exposer son solde individuel.
  const patrimoineTotal = rows.reduce((s, a) => s + a.balance, 0)
  // Spark = épargne CUMULÉE des mois — proxy RÉEL de la TENDANCE du patrimoine (pas
  // les soldes absolus mensuels ; le vrai historique de solde = chantier dédié futur).
  let cum = 0
  const patrimoineSpark = months.map((m) => (cum += m.epargne ?? 0))
  return c.json({ accounts: rows.map(maskAccount), patrimoineTotal, patrimoineSpark })
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
  const recentTransactions = await listTransactionsDetailed(userId, { accountId: a.id, limit: 5 })
  return c.json({ account: maskAccount(a), recentTransactions })
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
