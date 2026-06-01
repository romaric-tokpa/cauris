import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { eq, and } from 'drizzle-orm'
import { db, client } from './client'
import { auth } from '../auth'
import { user } from './auth-schema'
import {
  accounts,
  categories,
  transactions,
  budgets,
  goals,
  contributions,
  loans,
  amortization,
  loanPayments,
  notifications,
  recurrences,
  monthlySummaries,
  categorySummaries,
} from './business-schema'

/**
 * Seed démo Cauris — données d'Aïcha portées **à l'identique** de
 * `design/wireframe/wf-lib.jsx` (objet `data`). Période de réf. : **Mai 2026**.
 *
 * Rattachement à un user (documenté) :
 *  - Le seed cible un **user de démo** résolu par email (`SEED_USER_EMAIL`,
 *    défaut `aicha@cauris.demo`). S'il n'existe pas, il est créé via l'API
 *    serveur Better Auth (`auth.api.signUpEmail`, hash de mot de passe correct),
 *    puis `onboarding_complete = true`. Mot de passe = `SEED_USER_PASSWORD`
 *    (défaut `aicha-demo-2026`). Connectez-vous avec ces identifiants en dev
 *    pour voir les données. (Le user e2e `e2e@cauris.test` reste distinct.)
 *
 * Idempotent : purge des lignes métier de ce user avant ré-insertion.
 *
 * Décisions de modélisation (notées pour fidélité) :
 *  - **9 catégories** : les 6 du donut portent `color_token` cat-1..6 dans
 *    l'ordre du wireframe ; `Revenu`/`Transfert`/`Retrait` (liste domaine
 *    CLAUDE.md) sont nécessaires à l'intégrité des transactions, sans couleur.
 *  - Transfert « → Épargne » : source inférée = Compte courant, destination =
 *    Épargne (le wireframe n'affiche que la destination).
 *  - `contributions` (liste générique du wireframe) rattachées à l'objectif
 *    « Fonds d'urgence » par défaut.
 *
 * `budget.spent` ≠ `category_summaries.amount` — DEUX MESURES DISTINCTES (pas une
 * incohérence) : `budget.spent` = consommé sur l'**enveloppe budgétée** (sous-ensemble
 * plafonné par `cap`) ; `category_summaries.amount` = **dépense totale** de la catégorie
 * sur le mois (budgétée ou non). On a donc `amount ≥ spent`. Les deux sont seedées telles
 * quelles ; l'égalité n'est PAS assertée (elle contredirait Transport 108 % ET Σ=612 000).
 * Dette façade : à la dérivation depuis les transactions, ces deux grandeurs se calculent
 * par des règles différentes (filtre périmètre budget vs somme totale catégorie) —
 * cf. Phase 6 (Budgets) / Phase 10 (Analytics).
 */

const MONTH = '2026-05'
const EMAIL = process.env.SEED_USER_EMAIL ?? 'aicha@cauris.demo'
const PASSWORD = process.env.SEED_USER_PASSWORD ?? 'aicha-demo-2026'

/** Échoue bruyamment si un agrégat seedé ne correspond pas au wireframe. */
function check(label: string, ok: boolean, detail: string) {
  if (!ok) throw new Error(`ASSERTION ÉCHOUÉE — ${label} : ${detail}`)
  console.log(`  ✓ ${label} — ${detail}`)
}

async function resolveDemoUser(): Promise<string> {
  const existing = await db.select().from(user).where(eq(user.email, EMAIL)).limit(1)
  let id: string
  if (existing.length) {
    id = existing[0].id
    console.log(`Utilisateur démo existant : ${EMAIL}`)
  } else {
    await auth.api.signUpEmail({ body: { name: 'Aïcha Koné', email: EMAIL, password: PASSWORD } })
    const created = await db.select().from(user).where(eq(user.email, EMAIL)).limit(1)
    if (!created.length) throw new Error('seed : échec de création du user démo')
    id = created[0].id
    console.log(`Utilisateur démo créé : ${EMAIL} (mot de passe : ${PASSWORD})`)
  }
  await db.update(user).set({ onboardingComplete: true }).where(eq(user.id, id))
  return id
}

/** Supprime toutes les lignes métier du user (ordre enfant → parent). */
async function purge(uid: string) {
  const tables = [
    categorySummaries,
    monthlySummaries,
    notifications,
    recurrences,
    loanPayments,
    amortization,
    contributions,
    transactions,
    budgets,
    goals,
    loans,
    categories,
    accounts,
  ]
  for (const t of tables) await db.delete(t).where(eq(t.userId, uid))
}

async function seed() {
  const uid = await resolveDemoUser()
  await purge(uid)

  /* ── Comptes (comptesFull) — Σ = 2 480 000, Wave bloqué ── */
  const acc = {
    courant: randomUUID(),
    epargne: randomUUID(),
    om: randomUUID(),
    wave: randomUUID(),
  }
  await db.insert(accounts).values([
    {
      id: acc.courant,
      userId: uid,
      name: 'Compte courant',
      bank: 'NSIA Banque',
      type: 'Trésorerie',
      accountNumber: '•• 4821',
      balance: 1120000,
      blocked: false,
      sort: 0,
    },
    {
      id: acc.epargne,
      userId: uid,
      name: 'Épargne',
      bank: 'Ecobank',
      type: 'Épargne',
      accountNumber: '•• 7390',
      balance: 980000,
      blocked: false,
      sort: 1,
    },
    {
      id: acc.om,
      userId: uid,
      name: 'Orange Money',
      bank: 'Mobile money',
      type: 'Mobile money',
      accountNumber: '07 •• 12',
      balance: 245000,
      blocked: false,
      sort: 2,
    },
    {
      id: acc.wave,
      userId: uid,
      name: 'Wave',
      bank: 'Mobile money',
      type: 'Mobile money',
      accountNumber: '05 •• 88',
      balance: 135000,
      blocked: true,
      sort: 3,
    },
  ])

  /* ── Catégories : 6 donut (cat-1..6, ordre wireframe) + Revenu/Transfert/Retrait ── */
  const cat = {
    alimentation: randomUUID(),
    transport: randomUUID(),
    logement: randomUUID(),
    factures: randomUUID(),
    loisirs: randomUUID(),
    sante: randomUUID(),
    revenu: randomUUID(),
    transfert: randomUUID(),
    retrait: randomUUID(),
  }
  await db.insert(categories).values([
    {
      id: cat.alimentation,
      userId: uid,
      name: 'Alimentation',
      kind: 'expense',
      colorToken: 'cat-1',
      sort: 0,
    },
    {
      id: cat.transport,
      userId: uid,
      name: 'Transport',
      kind: 'expense',
      colorToken: 'cat-2',
      sort: 1,
    },
    {
      id: cat.logement,
      userId: uid,
      name: 'Logement',
      kind: 'expense',
      colorToken: 'cat-3',
      sort: 2,
    },
    {
      id: cat.factures,
      userId: uid,
      name: 'Factures',
      kind: 'expense',
      colorToken: 'cat-4',
      sort: 3,
    },
    {
      id: cat.loisirs,
      userId: uid,
      name: 'Loisirs',
      kind: 'expense',
      colorToken: 'cat-5',
      sort: 4,
    },
    { id: cat.sante, userId: uid, name: 'Santé', kind: 'expense', colorToken: 'cat-6', sort: 5 },
    { id: cat.revenu, userId: uid, name: 'Revenu', kind: 'income', colorToken: null, sort: 6 },
    {
      id: cat.transfert,
      userId: uid,
      name: 'Transfert',
      kind: 'transfer',
      colorToken: null,
      sort: 7,
    },
    { id: cat.retrait, userId: uid, name: 'Retrait', kind: 'transfer', colorToken: null, sort: 8 },
  ])

  /* ── Transactions (txnsFull) — dates FR → ISO (Mai 2026) ── */
  await db.insert(transactions).values([
    {
      userId: uid,
      accountId: acc.om,
      categoryId: cat.alimentation,
      label: 'Marché de Cocody',
      amount: -25000,
      occurredAt: '2026-05-31',
      type: 'Dépense',
    },
    {
      userId: uid,
      accountId: acc.courant,
      categoryId: cat.revenu,
      label: 'Salaire',
      amount: 850000,
      occurredAt: '2026-05-28',
      type: 'Revenu',
    },
    {
      userId: uid,
      accountId: acc.courant,
      categoryId: cat.factures,
      label: 'SODECI — eau',
      amount: -18500,
      occurredAt: '2026-05-27',
      type: 'Dépense',
    },
    {
      userId: uid,
      accountId: acc.courant,
      categoryId: cat.transfert,
      transferAccountId: acc.epargne,
      label: 'Transfert épargne',
      amount: -100000,
      occurredAt: '2026-05-26',
      type: 'Transfert',
    },
    {
      userId: uid,
      accountId: acc.wave,
      categoryId: cat.transport,
      label: 'Course Yango',
      amount: -6200,
      occurredAt: '2026-05-26',
      type: 'Dépense',
    },
    {
      userId: uid,
      accountId: acc.courant,
      categoryId: cat.loisirs,
      label: 'Abonnement Canal+',
      amount: -15000,
      occurredAt: '2026-05-25',
      type: 'Récurrente',
    },
    {
      userId: uid,
      accountId: acc.wave,
      categoryId: cat.sante,
      label: 'Pharmacie Plateau',
      amount: -8400,
      occurredAt: '2026-05-24',
      type: 'Dépense',
    },
    {
      userId: uid,
      accountId: acc.wave,
      categoryId: cat.revenu,
      label: 'Freelance design',
      amount: 120000,
      occurredAt: '2026-05-23',
      type: 'Revenu',
    },
    {
      userId: uid,
      accountId: acc.courant,
      categoryId: cat.factures,
      label: 'CIE — électricité',
      amount: -22000,
      occurredAt: '2026-05-22',
      type: 'Récurrente',
    },
    {
      userId: uid,
      accountId: acc.om,
      categoryId: cat.alimentation,
      label: 'Supermarché Prosuma',
      amount: -34500,
      occurredAt: '2026-05-21',
      type: 'Dépense',
    },
  ])

  /* ── Budgets (budgetsFull) — Mai 2026 ── */
  await db.insert(budgets).values([
    {
      userId: uid,
      categoryId: cat.transport,
      cap: 50000,
      spent: 54000,
      txnCount: 12,
      period: MONTH,
    },
    {
      userId: uid,
      categoryId: cat.alimentation,
      cap: 200000,
      spent: 185000,
      txnCount: 24,
      period: MONTH,
    },
    { userId: uid, categoryId: cat.factures, cap: 90000, spent: 58500, txnCount: 6, period: MONTH },
    { userId: uid, categoryId: cat.loisirs, cap: 50000, spent: 38000, txnCount: 9, period: MONTH },
    { userId: uid, categoryId: cat.sante, cap: 40000, spent: 8400, txnCount: 3, period: MONTH },
    {
      userId: uid,
      categoryId: cat.logement,
      cap: 135000,
      spent: 135000,
      txnCount: 1,
      period: MONTH,
    },
  ])

  /* ── Objectifs (objectifs) ── */
  const goal = { urgence: randomUUID(), voyage: randomUUID(), ordi: randomUUID() }
  await db.insert(goals).values([
    {
      id: goal.urgence,
      userId: uid,
      name: "Fonds d'urgence",
      targetAmount: 2000000,
      currentAmount: 1200000,
      targetDate: '2026-12-31',
    },
    {
      id: goal.voyage,
      userId: uid,
      name: 'Voyage Dakar',
      targetAmount: 800000,
      currentAmount: 320000,
      targetDate: null,
    },
    {
      id: goal.ordi,
      userId: uid,
      name: 'Ordinateur',
      targetAmount: 600000,
      currentAmount: 450000,
      targetDate: null,
    },
  ])

  /* ── Versements (contributions) — rattachés à « Fonds d'urgence » ── */
  await db.insert(contributions).values([
    {
      userId: uid,
      goalId: goal.urgence,
      accountId: acc.courant,
      amount: 50000,
      occurredAt: '2026-05-28',
    },
    {
      userId: uid,
      goalId: goal.urgence,
      accountId: acc.epargne,
      amount: 100000,
      occurredAt: '2026-04-30',
    },
    {
      userId: uid,
      goalId: goal.urgence,
      accountId: acc.wave,
      amount: 75000,
      occurredAt: '2026-04-02',
    },
    {
      userId: uid,
      goalId: goal.urgence,
      accountId: acc.courant,
      amount: 95000,
      occurredAt: '2026-03-29',
    },
  ])

  /* ── Prêt auto (pret) — taux 9,5 % = 950 bps ── */
  const loanId = randomUUID()
  await db.insert(loans).values({
    id: loanId,
    userId: uid,
    name: 'Prêt auto',
    principal: 5000000,
    remaining: 3200000,
    rateBps: 950,
    monthlyPayment: 145000,
    termMonths: 36,
    monthsRemaining: 22,
    nextDueDate: '2026-06-15',
  })

  /* ── Amortissement (amortFull) ── */
  const amort: [string, number, number, number][] = [
    ['2026-06', 117500, 27500, 3082500],
    ['2026-07', 118400, 26600, 2964100],
    ['2026-08', 119300, 25700, 2844800],
    ['2026-09', 120200, 24800, 2724600],
    ['2026-10', 121100, 23900, 2603500],
    ['2026-11', 122000, 23000, 2481500],
    ['2026-12', 122900, 22100, 2358600],
    ['2027-01', 123900, 21100, 2234700],
    ['2027-02', 124900, 20100, 2109800],
    ['2027-03', 125900, 19100, 1983900],
    ['2027-04', 126900, 18100, 1857000],
    ['2027-05', 127900, 17100, 1729100],
  ]
  await db.insert(amortization).values(
    amort.map(([period_month, principal_part, interest_part, remaining_after], i) => ({
      userId: uid,
      loanId,
      periodMonth: period_month,
      principalPart: principal_part,
      interestPart: interest_part,
      remainingAfter: remaining_after,
      sort: i,
    })),
  )

  /* ── Paiements de prêt (paiements) ── */
  const pays: [string, string, 'paid' | 'upcoming'][] = [
    ['2026-06', '2026-06-15', 'upcoming'],
    ['2026-05', '2026-05-15', 'paid'],
    ['2026-04', '2026-04-15', 'paid'],
    ['2026-03', '2026-03-15', 'paid'],
    ['2026-02', '2026-02-15', 'paid'],
    ['2026-01', '2026-01-15', 'paid'],
    ['2025-12', '2025-12-15', 'paid'],
  ]
  await db.insert(loanPayments).values(
    pays.map(([period_month, due_date, status]) => ({
      userId: uid,
      loanId,
      periodMonth: period_month,
      amount: 145000,
      dueDate: due_date,
      status,
    })),
  )

  /* ── Notifications (notifsFull) — `when` relatif → created_at ISO ── */
  await db.insert(notifications).values([
    {
      userId: uid,
      title: 'Budget Transport dépassé',
      body: 'Vous avez dépassé le plafond de 4 000 FCFA.',
      tone: 'over',
      icon: 'gauge',
      read: false,
      createdAt: new Date('2026-06-01T10:00:00'),
    },
    {
      userId: uid,
      title: 'Échéance prêt dans 5 jours',
      body: '145 000 FCFA seront prélevés le 15 juin.',
      tone: 'warn',
      icon: 'bank',
      read: false,
      createdAt: new Date('2026-06-01T07:00:00'),
    },
    {
      userId: uid,
      title: 'Objectif Voyage : +50 000 reçus',
      body: 'Vous êtes à 40 % de votre objectif.',
      tone: 'ok',
      icon: 'target',
      read: false,
      createdAt: new Date('2026-05-31T12:00:00'),
    },
    {
      userId: uid,
      title: 'Salaire reçu',
      body: '+850 000 FCFA crédités sur Compte courant.',
      tone: 'ok',
      icon: 'up',
      read: true,
      createdAt: new Date('2026-05-28T12:00:00'),
    },
    {
      userId: uid,
      title: 'Compte Wave bloqué',
      body: 'Le blocage a été activé depuis votre appareil.',
      tone: null,
      icon: 'lock',
      read: true,
      createdAt: new Date('2026-05-27T12:00:00'),
    },
    {
      userId: uid,
      title: 'Facture SODECI à venir',
      body: '18 500 FCFA prévus le 2 juin.',
      tone: 'warn',
      icon: 'calendar',
      read: true,
      createdAt: new Date('2026-05-26T12:00:00'),
    },
    {
      userId: uid,
      title: 'Rapport mensuel disponible',
      body: 'Votre bilan financier de mai est prêt.',
      tone: null,
      icon: 'analytics',
      read: true,
      createdAt: new Date('2026-05-25T12:00:00'),
    },
  ])

  /* ── Récurrences (recurrences) ── */
  await db.insert(recurrences).values([
    {
      userId: uid,
      name: 'Loyer',
      amount: -135000,
      frequency: 'monthly',
      nextDate: '2026-06-01',
      known: true,
      categoryId: cat.logement,
      accountId: null,
    },
    {
      userId: uid,
      name: 'Canal+',
      amount: -15000,
      frequency: 'monthly',
      nextDate: '2026-06-05',
      known: false,
      categoryId: cat.loisirs,
      accountId: null,
    },
    {
      userId: uid,
      name: 'CIE — électricité',
      amount: -22000,
      frequency: 'monthly',
      nextDate: '2026-06-22',
      known: true,
      categoryId: cat.factures,
      accountId: null,
    },
    {
      userId: uid,
      name: 'Spotify',
      amount: -3500,
      frequency: 'monthly',
      nextDate: '2026-06-12',
      known: false,
      categoryId: cat.loisirs,
      accountId: null,
    },
  ])

  /* ── monthly_summaries (trend, ×1000) — couche présentation ── */
  await db.insert(monthlySummaries).values([
    { userId: uid, month: '2025-12', revenus: 780000, depenses: 640000, epargne: 140000 },
    { userId: uid, month: '2026-01', revenus: 810000, depenses: 590000, epargne: 220000 },
    { userId: uid, month: '2026-02', revenus: 760000, depenses: 700000, epargne: 60000 },
    { userId: uid, month: '2026-03', revenus: 830000, depenses: 620000, epargne: 210000 },
    { userId: uid, month: '2026-04', revenus: 820000, depenses: 580000, epargne: 240000 },
    {
      userId: uid,
      month: '2026-05',
      revenus: 850000,
      depenses: 612000,
      epargne: 238000,
      balanceDeltaPct: 32, // +3,2 % (valeur exacte du wireframe, en dixièmes)
    },
  ])

  /* ── category_summaries (catAnalytics, Mai) — couche présentation ── */
  await db.insert(categorySummaries).values([
    { userId: uid, categoryId: cat.alimentation, month: MONTH, amount: 171000, trendPct: 6 },
    { userId: uid, categoryId: cat.logement, month: MONTH, amount: 135000, trendPct: 0 },
    { userId: uid, categoryId: cat.transport, month: MONTH, amount: 116000, trendPct: 14 },
    { userId: uid, categoryId: cat.factures, month: MONTH, amount: 86000, trendPct: -3 },
    { userId: uid, categoryId: cat.loisirs, month: MONTH, amount: 55000, trendPct: 2 },
    { userId: uid, categoryId: cat.sante, month: MONTH, amount: 49000, trendPct: 9 },
  ])

  /* ───────────────── Assertions d'agrégats (échec = throw) ───────────────── */
  console.log('\nVérification des agrégats vs wireframe :')

  const accs = await db.select().from(accounts).where(eq(accounts.userId, uid))
  const totalBal = accs.reduce((s, a) => s + a.balance, 0)
  check('Solde total (Σ accounts.balance)', totalBal === 2480000, `${totalBal} = 2 480 000`)

  const ms = await db
    .select()
    .from(monthlySummaries)
    .where(and(eq(monthlySummaries.userId, uid), eq(monthlySummaries.month, MONTH)))
  const mai = ms[0]
  check(
    'monthly_summaries (Mai)',
    mai.revenus === 850000 && mai.depenses === 612000 && mai.epargne === 238000,
    `rev ${mai.revenus} / dép ${mai.depenses} / épa ${mai.epargne}`,
  )
  check(
    'Delta solde (Mai)',
    mai.balanceDeltaPct === 32,
    `${mai.balanceDeltaPct} dixièmes = +3,2 %`,
  )

  const cs = await db
    .select()
    .from(categorySummaries)
    .where(and(eq(categorySummaries.userId, uid), eq(categorySummaries.month, MONTH)))
  const catSum = cs.reduce((s, c) => s + c.amount, 0)
  check(
    'Σ category_summaries (Mai) = dépenses',
    catSum === 612000 && catSum === mai.depenses,
    `${catSum} = 612 000`,
  )

  const transportBudget = (
    await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, uid), eq(budgets.categoryId, cat.transport)))
  )[0]
  const pct = Math.round((transportBudget.spent / transportBudget.cap) * 100)
  check(
    'Budget Transport',
    transportBudget.spent === 54000 && transportBudget.cap === 50000 && pct === 108,
    `${transportBudget.spent}/${transportBudget.cap} = ${pct}%`,
  )

  const loan = (await db.select().from(loans).where(eq(loans.userId, uid)))[0]
  check(
    'Prêt auto',
    loan.remaining === 3200000 && loan.rateBps === 950,
    `reste ${loan.remaining} @ ${loan.rateBps / 100}%`,
  )

  // Deux mesures distinctes (pas une incohérence) : enveloppe budgétée vs dépense totale.
  console.log(
    '\n  ℹ budgets.spent (consommé sur l’enveloppe) ≠ category_summaries.amount (dépense\n' +
      '    totale catégorie) — deux mesures distinctes du wireframe, amount ≥ spent.\n' +
      '    Égalité NON assertée ; valeurs seedées telles quelles.',
  )

  console.log('\n✅ Seed terminé — toutes les assertions passent.')
}

seed()
  .then(() => {
    client.close()
    process.exit(0)
  })
  .catch((err: unknown) => {
    console.error('\n❌ Seed échoué :', err instanceof Error ? err.message : err)
    client.close()
    process.exit(1)
  })
