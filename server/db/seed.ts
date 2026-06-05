import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { eq, and } from 'drizzle-orm'
import { db, client } from './client'
import { computeAccountBalances, computeNetWorth, computeDisplayTotal } from './queries'
import { auth } from '../auth'
import { user } from './auth-schema'
import {
  accounts,
  categories,
  transactions,
  envelopes,
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

  /* ── Comptes (comptesFull) — affichage « Solde total » = 2 480 000 (hors Espèces),
     patrimoine complet = 2 518 000 (Espèces incluse). Wave bloqué ── */
  const acc = {
    courant: randomUUID(),
    epargne: randomUUID(),
    om: randomUUID(),
    wave: randomUUID(),
    especes: randomUUID(),
  }
  // Modèle B : `balance` = solde INITIAL. Posé à 0 ici puis BACK-CALCULÉ après l'insert
  // des transactions (cf. plus bas) pour que le solde DÉRIVÉ reproduise les cibles wireframe.
  await db.insert(accounts).values([
    {
      id: acc.courant,
      userId: uid,
      name: 'Compte courant',
      bank: 'NSIA Banque',
      type: 'Trésorerie',
      accountNumber: '•• 4821',
      balance: 0,
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
      balance: 0,
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
      balance: 0,
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
      balance: 0,
      blocked: true,
      sort: 3,
    },
    {
      // Espèces — mode enveloppe (Lot B4). Solde 38 000 (= reste de l'enveloppe), SANS
      // transaction (aucune pollution des dépenses/catégories de mai). Hors « Solde total »
      // d'affichage mais DANS le patrimoine complet (computeNetWorth).
      id: acc.especes,
      userId: uid,
      name: 'Espèces',
      bank: 'Enveloppe · mode allégé',
      type: 'Espèces',
      accountNumber: '••',
      balance: 38000,
      blocked: false,
      sort: 4,
    },
  ])

  // Enveloppe cash : plafond 100 000, reste dérivé 38 000 ⇒ dépensé 62 000 (cap − left).
  await db.insert(envelopes).values({
    userId: uid,
    accountId: acc.especes,
    cap: 100000,
    period: '2026-05',
    lastReconciledAt: '2026-05-24',
  })

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

  /* ── Transactions — LEDGER de MAI 2026 enrichi (somme EXACTEMENT aux totaux du
     wireframe : revenus 850 000 ; dépenses 612 000 ventilées par catégorie selon
     le donut ; transfert −100 000 exclu des revenus/dépenses). Les lignes du
     wireframe (txnsFull) sont gardées, complétées par des opérations plausibles.
     NB : « Freelance design » 120 000 est déplacée au 23 AVRIL. RÈGLE assumée :
     seul le MOIS COURANT (mai) somme/dérive ; les transactions des mois PASSÉS
     sont ILLUSTRATIVES et ne se somment PAS — l'historique monthly_summaries fait
     foi pour le trend (monthly_summaries[avril]=820 000 reste autoritaire, non
     ajusté pour cette ligne). ── */
  type Acc = keyof typeof acc
  type Cat = keyof typeof cat
  interface Seed {
    l: string
    a: Acc
    c: Cat
    m: number
    d: string
    t: string
    tr?: Acc
  }
  const rows: Seed[] = [
    // — revenus —
    { l: 'Salaire', a: 'courant', c: 'revenu', m: 850000, d: '2026-05-28', t: 'Revenu' },
    { l: 'Freelance design', a: 'wave', c: 'revenu', m: 120000, d: '2026-04-23', t: 'Revenu' }, // AVRIL (illustratif)
    // — transfert (exclu des stats) —
    { l: 'Transfert épargne', a: 'courant', c: 'transfert', m: -100000, d: '2026-05-26', t: 'Transfert', tr: 'epargne' }, // prettier-ignore
    // — Alimentation → 171 000 —
    { l: 'Marché de Cocody', a: 'om', c: 'alimentation', m: -25000, d: '2026-05-31', t: 'Dépense' },
    { l: 'Supermarché Prosuma', a: 'om', c: 'alimentation', m: -34500, d: '2026-05-21', t: 'Dépense' }, // prettier-ignore
    { l: 'Marché de Cocody', a: 'om', c: 'alimentation', m: -28000, d: '2026-05-15', t: 'Dépense' },
    { l: 'Supermarché Prosuma', a: 'om', c: 'alimentation', m: -41500, d: '2026-05-12', t: 'Dépense' }, // prettier-ignore
    { l: 'Glovo (courses)', a: 'wave', c: 'alimentation', m: -22000, d: '2026-05-09', t: 'Dépense' },
    { l: 'Boulangerie du coin', a: 'om', c: 'alimentation', m: -20000, d: '2026-05-05', t: 'Dépense' }, // prettier-ignore
    // — Logement → 135 000 —
    { l: 'Loyer', a: 'courant', c: 'logement', m: -135000, d: '2026-05-01', t: 'Récurrente' },
    // — Transport → 116 000 —
    { l: 'Course Yango', a: 'wave', c: 'transport', m: -6200, d: '2026-05-26', t: 'Dépense' },
    { l: 'Carburant Total', a: 'courant', c: 'transport', m: -25000, d: '2026-05-20', t: 'Dépense' }, // prettier-ignore
    { l: 'Course Yango', a: 'om', c: 'transport', m: -4800, d: '2026-05-18', t: 'Dépense' },
    { l: 'Gbaka + bus', a: 'om', c: 'transport', m: -3000, d: '2026-05-15', t: 'Dépense' },
    { l: 'Course Yango', a: 'wave', c: 'transport', m: -12000, d: '2026-05-10', t: 'Dépense' },
    { l: 'Carburant Total', a: 'courant', c: 'transport', m: -15000, d: '2026-05-08', t: 'Dépense' }, // prettier-ignore
    { l: 'Réparation auto', a: 'courant', c: 'transport', m: -50000, d: '2026-05-06', t: 'Dépense' },
    // — Factures → 86 000 —
    { l: 'SODECI — eau', a: 'courant', c: 'factures', m: -18500, d: '2026-05-27', t: 'Dépense' },
    { l: 'CIE — électricité', a: 'courant', c: 'factures', m: -22000, d: '2026-05-22', t: 'Récurrente' }, // prettier-ignore
    { l: 'Facture Orange (internet)', a: 'courant', c: 'factures', m: -15500, d: '2026-05-14', t: 'Récurrente' }, // prettier-ignore
    { l: 'CIE — électricité (régul.)', a: 'courant', c: 'factures', m: -30000, d: '2026-05-03', t: 'Dépense' }, // prettier-ignore
    // — Loisirs → 55 000 —
    { l: 'Abonnement Canal+', a: 'courant', c: 'loisirs', m: -15000, d: '2026-05-25', t: 'Récurrente' }, // prettier-ignore
    { l: 'Restaurant Cocody', a: 'wave', c: 'loisirs', m: -20000, d: '2026-05-17', t: 'Dépense' },
    { l: 'Cinéma Majestic', a: 'om', c: 'loisirs', m: -16500, d: '2026-05-10', t: 'Dépense' },
    { l: 'Spotify', a: 'courant', c: 'loisirs', m: -3500, d: '2026-05-12', t: 'Récurrente' },
    // — Santé → 49 000 —
    { l: 'Pharmacie Plateau', a: 'wave', c: 'sante', m: -8400, d: '2026-05-24', t: 'Dépense' },
    { l: 'Pharmacie Plateau', a: 'wave', c: 'sante', m: -22600, d: '2026-05-16', t: 'Dépense' },
    { l: 'Consultation médicale', a: 'courant', c: 'sante', m: -18000, d: '2026-05-07', t: 'Dépense' }, // prettier-ignore
  ]
  /* Canal de paiement (Lot B1) — DÉTERMINISTE par compte source : om → Orange Money,
     wave → Wave, courant(NSIA)/epargne(Ecobank) → Banque. Un Transfert (mouvement
     interne) n'a pas de canal → null. (Aïcha n'a pas de compte espèces → 'cash' reste
     un canal valide non utilisé par le seed.) */
  const CHANNEL: Record<Acc, string> = {
    courant: 'banque',
    epargne: 'banque',
    om: 'orange_money',
    wave: 'wave',
    especes: 'cash', // (aucune transaction Espèces seedée — clé requise par le type)
  }
  await db.insert(transactions).values(
    rows.map((r) => ({
      userId: uid,
      accountId: acc[r.a],
      categoryId: cat[r.c],
      transferAccountId: r.tr ? acc[r.tr] : null,
      label: r.l,
      amount: r.m,
      occurredAt: r.d,
      type: r.t,
      channel: r.t === 'Transfert' ? null : CHANNEL[r.a],
    })),
  )

  /* ── Modèle B — back-calcul des soldes INITIAUX ──
     On veut que le solde DÉRIVÉ (initial + Σ mouvements de transactions) == cible wireframe.
     ⇒ initial = cible − Σ(mouvements). Σ(mouvements) calculé en mémoire depuis `rows`
     (même règle que computeAccountBalances : leg propre + leg destination du transfert ;
     les contributions NE comptent PAS — statu quo Phase 7). */
  // Espèces : pas de transaction → mouvement 0, cible = son solde direct 38 000 (back-calc neutre).
  const TARGET: Record<Acc, number> = { courant: 1120000, epargne: 980000, om: 245000, wave: 135000, especes: 38000 } // prettier-ignore
  const movement: Record<Acc, number> = { courant: 0, epargne: 0, om: 0, wave: 0, especes: 0 }
  for (const r of rows) {
    movement[r.a] += r.m
    if (r.tr) movement[r.tr] += -r.m
  }
  for (const k of Object.keys(TARGET) as Acc[]) {
    await db
      .update(accounts)
      .set({ balance: TARGET[k] - movement[k] })
      .where(eq(accounts.id, acc[k]))
  }

  /* ── Budgets (budgetsFull) — Mai 2026. Ids explicites : le budget Transport est
     la cible deep-link de la notif « Budget Transport dépassé ». ── */
  const bud = {
    transport: randomUUID(),
    alimentation: randomUUID(),
    factures: randomUUID(),
    loisirs: randomUUID(),
    sante: randomUUID(),
    logement: randomUUID(),
  }
  await db.insert(budgets).values([
    {
      id: bud.transport,
      userId: uid,
      categoryId: cat.transport,
      cap: 50000,
      spent: 54000,
      txnCount: 12,
      period: MONTH,
    },
    {
      id: bud.alimentation,
      userId: uid,
      categoryId: cat.alimentation,
      cap: 200000,
      spent: 185000,
      txnCount: 24,
      period: MONTH,
    },
    { id: bud.factures, userId: uid, categoryId: cat.factures, cap: 90000, spent: 58500, txnCount: 6, period: MONTH }, // prettier-ignore
    { id: bud.loisirs, userId: uid, categoryId: cat.loisirs, cap: 50000, spent: 38000, txnCount: 9, period: MONTH },
    { id: bud.sante, userId: uid, categoryId: cat.sante, cap: 40000, spent: 8400, txnCount: 3, period: MONTH },
    {
      id: bud.logement,
      userId: uid,
      categoryId: cat.logement,
      cap: 135000,
      spent: 135000,
      txnCount: 1,
      period: MONTH,
    },
    // Budgets ARCHIVÉS (mois clôturés) — alimentent l'onglet « Archivés » + Réactiver.
    // (Le libellé affiché dérive de la catégorie : modèle sans nom de budget custom.)
    { userId: uid, categoryId: cat.loisirs, cap: 150000, spent: 142000, txnCount: 8, period: '2025-12', archived: true }, // prettier-ignore
    { userId: uid, categoryId: cat.factures, cap: 200000, spent: 187500, txnCount: 11, period: '2025-09', archived: true }, // prettier-ignore
    { userId: uid, categoryId: cat.transport, cap: 300000, spent: 312000, txnCount: 15, period: '2025-08', archived: true }, // prettier-ignore
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

  /* ── Prêt auto (pret) — COHÉRENT. Le wireframe codait des chiffres en dur
     incohérents (amortissement ~10,3 % vs rateBps 9,5 % ; 22×145 000 < capital
     restant → le prêt ne s'amortit pas). On garde les ancres ICONIQUES (remaining
     3 200 000, rateBps 950, 22/36, principal 5 000 000) et on DÉRIVE la mensualité
     de la formule d'amortissement standard ; l'échéancier est régénéré par
     simulation entière depuis le capital restant → tout est cohérent, le moteur de
     simulation (src/lib/loanSim.ts) solde en exactement 22 mois. ── */
  const loanId = randomUUID()
  const LOAN_PRINCIPAL = 5000000
  const LOAN_REMAINING = 3200000
  const LOAN_RATE_BPS = 950
  const LOAN_TERM = 36
  const LOAN_MONTHS_REMAINING = 22
  const LOAN_FIRST_PERIOD = '2026-06' // 1re échéance future (nextDueDate 2026-06-15)
  const im = LOAN_RATE_BPS / 120000 // taux mensuel : 950 bps = 9,5 %/an ÷ 12
  // Mensualité = B·i / (1 − (1+i)^−n), arrondie au FCFA SUPÉRIEUR pour solder en n mois.
  const monthlyPayment = Math.ceil(
    (LOAN_REMAINING * im) / (1 - Math.pow(1 + im, -LOAN_MONTHS_REMAINING)),
  )

  // Échéancier régénéré : intérêt = round(solde·i), capital = mensualité − intérêt,
  // dernière échéance partielle (le capital restant est soldé exactement à 0).
  const addMonths = (ym: string, k: number): string => {
    const [y, m] = ym.split('-').map(Number)
    const t = y * 12 + (m - 1) + k
    return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`
  }
  const amortRows: {
    periodMonth: string
    principalPart: number
    interestPart: number
    remainingAfter: number
  }[] = []
  let loanBal = LOAN_REMAINING
  while (loanBal > 0) {
    const interestPart = Math.round(loanBal * im)
    const principalPart = Math.min(monthlyPayment - interestPart, loanBal)
    loanBal -= principalPart
    amortRows.push({
      periodMonth: addMonths(LOAN_FIRST_PERIOD, amortRows.length),
      principalPart,
      interestPart,
      remainingAfter: loanBal,
    })
  }

  await db.insert(loans).values({
    id: loanId,
    userId: uid,
    name: 'Prêt auto',
    principal: LOAN_PRINCIPAL,
    remaining: LOAN_REMAINING,
    rateBps: LOAN_RATE_BPS,
    monthlyPayment,
    termMonths: LOAN_TERM,
    monthsRemaining: LOAN_MONTHS_REMAINING,
    nextDueDate: '2026-06-15',
  })

  await db.insert(amortization).values(
    amortRows.map((r, i) => ({
      userId: uid,
      loanId,
      periodMonth: r.periodMonth,
      principalPart: r.principalPart,
      interestPart: r.interestPart,
      remainingAfter: r.remainingAfter,
      sort: i,
    })),
  )

  /* ── Paiements de prêt — échantillon récent (6 payés + 1 à venir), montant =
     mensualité dérivée. Le « payé à ce jour » (14/36) est calculé via loanMeta. ── */
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
      amount: monthlyPayment,
      dueDate: due_date,
      status,
    })),
  )

  /* ── Notifications (notifsFull) — `when` relatif → created_at ISO. Chaque notif
     porte un deep-link (link_type + link_id) vers une entité EXISTANTE du user, OU
     un lien d'écran (link_id null), OU rien (purement informative). Voir assertion
     « Notifications — deep-links » plus bas (aucun id orphelin). ── */
  await db.insert(notifications).values([
    {
      userId: uid,
      title: 'Budget Transport dépassé',
      body: 'Vous avez dépassé le plafond de 4 000 FCFA.',
      tone: 'over',
      icon: 'gauge',
      read: false,
      linkType: 'budget',
      linkId: bud.transport, // → /budgets/:id
      createdAt: new Date('2026-06-01T10:00:00'),
    },
    {
      userId: uid,
      title: 'Échéance prêt dans 5 jours',
      body: '145 000 FCFA seront prélevés le 15 juin.',
      tone: 'warn',
      icon: 'bank',
      read: false,
      linkType: 'loan',
      linkId: loanId, // → /pret (prêt unique ; id stocké pour cohérence/futur)
      createdAt: new Date('2026-06-01T07:00:00'),
    },
    {
      userId: uid,
      title: 'Objectif Voyage : +50 000 reçus',
      body: 'Vous êtes à 40 % de votre objectif.',
      tone: 'ok',
      icon: 'target',
      read: false,
      linkType: 'goal',
      linkId: goal.voyage, // → /objectifs/:id
      createdAt: new Date('2026-05-31T12:00:00'),
    },
    {
      userId: uid,
      title: 'Salaire reçu',
      body: '+850 000 FCFA crédités sur Compte courant.',
      tone: 'ok',
      icon: 'up',
      read: true,
      linkType: 'transactions',
      linkId: null, // → /transactions (revenu, liste non filtrée)
      createdAt: new Date('2026-05-28T12:00:00'),
    },
    {
      userId: uid,
      title: 'Compte Wave bloqué',
      body: 'Le blocage a été activé depuis votre appareil.',
      tone: null,
      icon: 'lock',
      read: true,
      linkType: 'account',
      linkId: acc.wave, // → /comptes/:id
      createdAt: new Date('2026-05-27T12:00:00'),
    },
    {
      userId: uid,
      title: 'Facture SODECI à venir',
      body: '18 500 FCFA prévus le 2 juin.',
      tone: 'warn',
      icon: 'calendar',
      read: true,
      linkType: 'transactions',
      linkId: cat.factures, // → /transactions?categoryId=… (dépenses Factures)
      createdAt: new Date('2026-05-26T12:00:00'),
    },
    {
      userId: uid,
      title: 'Rapport mensuel disponible',
      body: 'Votre bilan financier de mai est prêt.',
      tone: null,
      icon: 'analytics',
      read: true,
      linkType: 'analytics',
      linkId: null, // → /analytics
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

  /* ── monthly_summaries — HISTORIQUE (mois passés) + ligne du mois courant.
     Les mois PASSÉS portent leurs totaux pleins (source du trend 6 mois). Le MOIS
     COURANT (MONTH) est désormais DÉRIVÉ par la façade depuis le ledger : sa ligne
     ne porte donc PLUS de totaux (NULL) — elle ne garde que `balance_delta_pct`
     (non dérivable, pas d'historique de solde). Voir façade getMonthlySummary. ── */
  await db.insert(monthlySummaries).values([
    { userId: uid, month: '2025-12', revenus: 780000, depenses: 640000, epargne: 140000 },
    { userId: uid, month: '2026-01', revenus: 810000, depenses: 590000, epargne: 220000 },
    { userId: uid, month: '2026-02', revenus: 760000, depenses: 700000, epargne: 60000 },
    { userId: uid, month: '2026-03', revenus: 830000, depenses: 620000, epargne: 210000 },
    { userId: uid, month: '2026-04', revenus: 820000, depenses: 580000, epargne: 240000 },
    {
      userId: uid,
      month: MONTH, // mois courant : totaux NULL (dérivés du ledger), delta seul
      revenus: null,
      depenses: null,
      epargne: null,
      balanceDeltaPct: 32, // +3,2 % (valeur exacte du wireframe, en dixièmes)
    },
  ])

  /* ── category_summaries — le donut du MOIS COURANT est DÉRIVÉ du ledger par la
     façade : aucune ligne du mois courant n'est seedée (la table reste pour de
     futurs snapshots historiques de mois clôturés). ── */

  /* ───────────────── Assertions d'agrégats (échec = throw) ───────────────── */
  console.log('\nVérification des agrégats vs wireframe :')

  // Modèle B : on vérifie les soldes DÉRIVÉS (via la VRAIE façade, pas la colonne brute).
  const derived = await computeAccountBalances(uid)
  check('Solde dérivé — Compte courant', derived.get(acc.courant) === 1120000, `${derived.get(acc.courant)} = 1 120 000`) // prettier-ignore
  check('Solde dérivé — Épargne', derived.get(acc.epargne) === 980000, `${derived.get(acc.epargne)} = 980 000`) // prettier-ignore
  check('Solde dérivé — Orange Money', derived.get(acc.om) === 245000, `${derived.get(acc.om)} = 245 000`) // prettier-ignore
  check('Solde dérivé — Wave', derived.get(acc.wave) === 135000, `${derived.get(acc.wave)} = 135 000`) // prettier-ignore
  check('Solde dérivé — Espèces', derived.get(acc.especes) === 38000, `${derived.get(acc.especes)} = 38 000`) // prettier-ignore
  // Lot B4 — DISTINCTION assertée : agrégat d'affichage (hors enveloppe) ≠ patrimoine complet.
  const net = await computeNetWorth(uid)
  check('Patrimoine COMPLET (cash inclus)', net === 2518000, `${net} = 2 518 000`)
  const displayTotal = await computeDisplayTotal(uid)
  check('Solde total AFFICHAGE (hors enveloppe)', displayTotal === 2480000, `${displayTotal} = 2 480 000`)
  // Enveloppe : dépensé = cap − reste = 100 000 − 38 000.
  check('Enveloppe espèces — dépensé (cap − left)', 100000 - (derived.get(acc.especes) ?? 0) === 62000, `${100000 - (derived.get(acc.especes) ?? 0)} = 62 000`) // prettier-ignore

  /* — DÉRIVABILITÉ : le ledger de MAI somme EXACTEMENT aux totaux (preuve que la
     façade pourra dériver). Transferts exclus des revenus/dépenses. — */
  const all = await db.select().from(transactions).where(eq(transactions.userId, uid))
  const may = all.filter((t) => t.occurredAt.startsWith('2026-05'))
  const sum = (rows: typeof may) => rows.reduce((s, t) => s + t.amount, 0)
  const income = sum(may.filter((t) => t.type !== 'Transfert' && t.amount > 0))
  const expense = sum(may.filter((t) => t.type !== 'Transfert' && t.amount < 0))
  check('Ledger mai — revenus (Σ hors transfert)', income === 850000, `${income} = 850 000`)
  check('Ledger mai — dépenses (Σ hors transfert)', expense === -612000, `${expense} = -612 000`)
  check('Ledger mai — épargne dérivée', income + expense === 238000, `${income + expense} = 238 000`)

  const byCat = (id: string) => sum(may.filter((t) => t.categoryId === id && t.amount < 0))
  const targets: [string, string, number][] = [
    ['Alimentation', cat.alimentation, -171000],
    ['Transport', cat.transport, -116000],
    ['Logement', cat.logement, -135000],
    ['Factures', cat.factures, -86000],
    ['Loisirs', cat.loisirs, -55000],
    ['Santé', cat.sante, -49000],
  ]
  let catTotal = 0
  for (const [name, id, target] of targets) {
    const v = byCat(id)
    catTotal += v
    check(`Ledger mai — catégorie ${name}`, v === target, `${v} = ${target}`)
  }
  check('Ledger mai — Σ catégories', catTotal === -612000, `${catTotal} = -612 000`)
  const transfers = sum(may.filter((t) => t.type === 'Transfert'))
  check(
    'Ledger mai — transferts exclus',
    transfers === -100000,
    `transfert ${transfers} hors revenus/dépenses`,
  )

  /* — Canal de paiement (Lot B1) : liste fermée. Tout Transfert a un canal null ;
     toute autre opération a un canal ∈ { wave, orange_money, cash, banque }. — */
  const CHANNELS = ['wave', 'orange_money', 'cash', 'banque']
  const channelOk = all.every((t) =>
    t.type === 'Transfert' ? t.channel === null : t.channel != null && CHANNELS.includes(t.channel),
  )
  check('Canal — Transfert null / autres ∈ liste fermée', channelOk, `${all.length} opérations`)

  /* — Mois courant : la ligne monthly_summaries ne porte PLUS de totaux (dérivés
     du ledger), seulement le delta solde. category_summaries du mois courant
     supprimées (le donut dérive). On asserte l'ÉTAT « source unique = ledger ». — */
  const ms = await db
    .select()
    .from(monthlySummaries)
    .where(and(eq(monthlySummaries.userId, uid), eq(monthlySummaries.month, MONTH)))
  const mai = ms[0]
  check(
    'monthly_summaries (Mai) — totaux NULL (dérivés du ledger)',
    mai.revenus === null && mai.depenses === null && mai.epargne === null,
    `rev ${mai.revenus} / dép ${mai.depenses} / épa ${mai.epargne}`,
  )
  check('Delta solde (Mai)', mai.balanceDeltaPct === 32, `${mai.balanceDeltaPct} dixièmes = +3,2 %`)

  const cs = await db
    .select()
    .from(categorySummaries)
    .where(and(eq(categorySummaries.userId, uid), eq(categorySummaries.month, MONTH)))
  check(
    'category_summaries (Mai) — aucune (donut dérivé du ledger)',
    cs.length === 0,
    `${cs.length} ligne(s)`,
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
  const amortDb = await db.select().from(amortization).where(eq(amortization.userId, uid))
  const sumPrincipal = amortDb.reduce((s, r) => s + r.principalPart, 0)
  const lastAmort = amortDb.reduce((a, b) => (b.sort > a.sort ? b : a))
  const iCheck = loan.rateBps / 120000
  const expectedM = Math.ceil(
    (loan.remaining * iCheck) / (1 - Math.pow(1 + iCheck, -loan.monthsRemaining)),
  )
  check(
    'Prêt auto — cohérent',
    loan.remaining === 3200000 &&
      loan.rateBps === 950 &&
      loan.monthlyPayment === expectedM &&
      sumPrincipal === loan.remaining &&
      lastAmort.remainingAfter === 0 &&
      amortDb.length === loan.monthsRemaining,
    `mensualité ${loan.monthlyPayment} (formule ${expectedM}) · Σcapital ${sumPrincipal} === ${loan.remaining} · ${amortDb.length} lignes · solde final ${lastAmort.remainingAfter}`,
  )

  // Deux mesures distinctes (pas une incohérence) : enveloppe budgétée vs dépense totale.
  console.log(
    '\n  ℹ budgets.spent (consommé sur l’enveloppe) ≠ category_summaries.amount (dépense\n' +
      '    totale catégorie) — deux mesures distinctes du wireframe, amount ≥ spent.\n' +
      '    Égalité NON assertée ; valeurs seedées telles quelles.',
  )

  /* — Deep-links : chaque notif est soit liée à une entité EXISTANTE du user
     (budget/goal/account → link_id requis ; loan → le prêt ; transactions → une
     catégorie ou null), soit un lien d'écran sans id (transactions/analytics),
     soit informative. Aucun link_id orphelin. — */
  const notifs = await db.select().from(notifications).where(eq(notifications.userId, uid))
  const idSet = async (table: typeof budgets | typeof goals | typeof accounts | typeof loans | typeof categories) =>
    new Set((await db.select({ id: table.id }).from(table).where(eq(table.userId, uid))).map((r) => r.id))
  const [budgetIds, goalIds, accountIds, loanIds, categoryIds] = await Promise.all([
    idSet(budgets),
    idSet(goals),
    idSet(accounts),
    idSet(loans),
    idSet(categories),
  ])
  const linkResolves = (type: string | null, id: string | null): boolean => {
    switch (type) {
      case 'budget':
        return id != null && budgetIds.has(id)
      case 'goal':
        return id != null && goalIds.has(id)
      case 'account':
        return id != null && accountIds.has(id)
      case 'loan':
        return id == null || loanIds.has(id)
      case 'transactions':
        return id == null || categoryIds.has(id) // null = liste, sinon catégorie existante
      case 'analytics':
        return id == null // lien d'écran, pas d'id
      case null:
        return id == null // notif informative
      default:
        return false
    }
  }
  const orphans = notifs.filter((n) => !linkResolves(n.linkType, n.linkId))
  check(
    'Notifications — deep-links (aucun id orphelin)',
    notifs.length === 7 && orphans.length === 0,
    `${notifs.length} notifs · ${orphans.length} orphelin(s)${orphans.length ? ' : ' + orphans.map((n) => n.title).join(', ') : ''}`,
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
