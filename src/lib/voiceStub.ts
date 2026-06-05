import { money } from './money'
import type { AccountRef, CategoryRef } from '../screens/transactions/useTransactions'

/**
 * FRONTIÈRE UNIQUE de la capture assistée — partagée par la **note vocale** (Lot B2) et
 * la **saisie conversationnelle / texte libre** (Lot B3). Pattern « comme askClaude ».
 *
 * Un SEUL point de bascule vers du réel plus tard :
 *  - `simulateTranscription()` — STT **SIMULÉ** (phrase canonique), propre à la voix.
 *  - `extractDraft(text, …)` — extraction **RÉELLE** (parsing déterministe → champs +
 *     résolution compte/catégorie sur les données de l'utilisateur). `text` = une
 *     transcription (voix) OU le texte tapé par l'utilisateur (chat). Cette logique
 *     tournera telle quelle le jour d'un vrai LLM — qui s'appellera côté SERVEUR (clé
 *     Anthropic jamais cliente, cf. CLAUDE.md) : seule la source du `text` changera.
 *
 * Texte libre ⇒ le cas NON RÉSOLU (confiances basses) est NORMAL, pas l'exception.
 * Aucune transaction n'est créée ici : on ne produit qu'un BROUILLON à valider.
 */

/** Phrase canonique du wireframe (`wf-lib.voiceDraft.transcript`). */
export const CANNED_TRANSCRIPT = 'Wave 3 500 pour le déjeuner'

/** Niveau de confiance d'un champ extrait (libellés UI : Sûr / À vérifier / Incertain). */
export type Confidence = 'high' | 'med' | 'low'

export interface VoiceField {
  /** Libellé affiché (Montant, Type, Canal, Catégorie, Compte, Date). */
  label: string
  /** Valeur lisible (déjà formatée). */
  value: string
  conf: Confidence
}

/** Brouillon prêt à pré-remplir le formulaire B1 / à valider directement. */
export interface VoicePrefill {
  type: string
  label: string
  amount: number // magnitude positive (le serveur dérive le signe)
  accountId: string // '' si NON RÉSOLU → l'utilisateur doit choisir (garde anti-inerte)
  categoryId: string // '' si aucune
  channel: string // canal B1 (liste fermée)
  occurredAt: string // YYYY-MM-DD
}

export interface VoiceDraft {
  transcript: string
  fields: VoiceField[]
  prefill: VoicePrefill
  /** Faux tant que le compte n'est pas résolu → « Valider » reste désactivé. */
  resolved: boolean
}

/**
 * STT simulé. Renvoie la phrase canonique après un court délai (ressenti « traitement »).
 * SEUL point factice — à remplacer par un vrai speech-to-text (l'API en aval ne change pas).
 */
export function simulateTranscription(): Promise<string> {
  return new Promise((resolve) => setTimeout(() => resolve(CANNED_TRANSCRIPT), 650))
}

/** Date du jour ISO (`YYYY-MM-DD`) — le brouillon est daté « Aujourd'hui ». */
export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ─────────────────────────── SMS Android (Lot B5) ─────────────────────────── */

/** Un SMS transactionnel (expéditeur, heure, texte brut). */
export interface SmsMessage {
  from: string
  when: string
  raw: string
}

/**
 * STUB SMS — boîte canonique déterministe. AUCUNE lecture réelle (permissions Android
 * inexistantes en web). Le canal est présent DANS le texte → `extractDraft` le résout
 * tel quel. SEUL point factice à remplacer par une vraie passerelle SMS Android.
 */
export const SIMULATED_SMS: SmsMessage[] = [
  {
    from: 'Wave',
    when: '13:24',
    raw: 'Paiement de 3 500 FCFA chez Resto Belleville via Wave. Solde : 131 500 FCFA.',
  },
  {
    from: 'Orange Money',
    when: 'Hier',
    raw: 'Transfert reçu de 150 000 FCFA sur Orange Money. Nouveau solde : 395 000 FCFA.',
  },
]

/** Renvoie la boîte SMS simulée (court délai → ressenti « lecture »). */
export function simulateSmsInbox(): Promise<SmsMessage[]> {
  return new Promise((resolve) => setTimeout(() => resolve(SIMULATED_SMS), 500))
}

/** Mots-clés canal → valeur B1 (liste fermée). */
const CHANNEL_KEYWORDS: { re: RegExp; channel: string; label: string }[] = [
  { re: /\bwave\b/i, channel: 'wave', label: 'Wave' },
  { re: /\borange\b/i, channel: 'orange_money', label: 'Orange Money' },
  { re: /\b(cash|esp[eè]ces?)\b/i, channel: 'cash', label: 'Cash' },
  { re: /\b(banque|nsia|ecobank|carte)\b/i, channel: 'banque', label: 'Banque' },
]

/** Indices de catégorie (mot-clé → nom de catégorie cherché chez l'utilisateur). */
const CATEGORY_HINTS: { re: RegExp; name: string }[] = [
  { re: /\b(d[ée]jeuner|repas|march[ée]|resto|restaurant|courses?)\b/i, name: 'Alimentation' },
  { re: /\b(yango|taxi|transport|carburant|bus)\b/i, name: 'Transport' },
  { re: /\b(loyer|logement|maison)\b/i, name: 'Logement' },
  // « courant » = électricité (CIE) dans l'usage local → Factures (ex. wireframe chat).
  { re: /\b(facture|sodeci|cie|internet|courant|[ée]lectric)/i, name: 'Factures' },
  { re: /\b(pharmacie|sant[ée]|m[ée]decin)\b/i, name: 'Santé' },
  { re: /\b(salaire|revenu|paie)\b/i, name: 'Revenu' },
]

/** Mots-clés « entrée » → type Revenu (sinon Dépense). */
const INCOME_RE = /\b(re[çc]u|salaire|revenu|pay[ée]e?)\b/i

/** Mots trop génériques pour identifier un compte par son nom (évite les faux positifs). */
const ACCOUNT_STOPWORDS = new Set(['compte', 'mobile', 'money', 'banque', 'mon', 'ma'])

/**
 * Résout le compte source. 1) par mot-clé CANAL présent dans le nom/banque du compte
 * (« Wave », « Orange Money ») ; 2) sinon, par un mot SIGNIFICATIF du nom d'un compte
 * présent dans le texte (« courant », « épargne »…). Texte libre ⇒ souvent NON RÉSOLU.
 */
function resolveAccount(
  text: string,
  accounts: AccountRef[],
  chanHit: { re: RegExp } | undefined,
): AccountRef | undefined {
  if (chanHit) {
    const byChannel = accounts.find((a) => chanHit.re.test(a.name) || chanHit.re.test(a.bank))
    if (byChannel) return byChannel
  }
  const low = text.toLowerCase()
  return accounts.find((a) =>
    a.name
      .toLowerCase()
      .split(/\s+/)
      .some((w) => w.length >= 4 && !ACCOUNT_STOPWORDS.has(w) && low.includes(w)),
  )
}

/** Extrait le 1er montant entier du texte (« 3 500 » → 3500). 0 si absent. */
function parseAmount(text: string): number {
  const m = text.match(/\d[\d\s\u00a0\u202f]*/)
  if (!m) return 0
  const n = Number(m[0].replace(/\D/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** Motif lisible (après « pour … ») → libellé, capitalisé. Fallback : la transcription. */
function parseLabel(text: string): string {
  const m = text.match(/pour\s+(?:le|la|les|l['’]|du|des|un|une)?\s*(.+)$/i)
  const raw = (m ? m[1] : text).trim().replace(/[.!?]+$/, '')
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : text
}

/**
 * Extraction RÉELLE (déterministe) : parse le texte et résout compte/catégorie sur les
 * données de l'utilisateur. Le compte est résolu par correspondance de nom avec le canal
 * détecté (ex. « Wave » → compte nommé Wave). S'il n'existe pas → NON RÉSOLU (conf low,
 * `accountId: ''`, `resolved: false`) : « Valider » se désactive, on oriente vers Corriger.
 */
export function extractDraft(
  transcript: string,
  accounts: AccountRef[],
  categories: CategoryRef[],
  today: string,
): VoiceDraft {
  const amount = parseAmount(transcript)
  const isIncome = INCOME_RE.test(transcript)
  const type = isIncome ? 'Revenu' : 'Dépense'

  const chanHit = CHANNEL_KEYWORDS.find((c) => c.re.test(transcript))
  const channel = chanHit?.channel ?? 'cash'
  const channelLabel = chanHit?.label ?? 'Cash'

  const catHit = CATEGORY_HINTS.find((h) => h.re.test(transcript))
  const category = catHit
    ? categories.find((c) => c.name.toLowerCase() === catHit.name.toLowerCase())
    : undefined

  const account = resolveAccount(transcript, accounts, chanHit)
  const resolved = Boolean(account)

  const prefill: VoicePrefill = {
    type,
    label: parseLabel(transcript),
    amount,
    accountId: account?.id ?? '',
    categoryId: category?.id ?? '',
    channel,
    occurredAt: today,
  }

  const fields: VoiceField[] = [
    { label: 'Montant', value: `${money(amount)} FCFA`, conf: amount > 0 ? 'high' : 'low' },
    { label: 'Type', value: type, conf: isIncome ? 'high' : 'med' },
    { label: 'Canal', value: channelLabel, conf: chanHit ? 'high' : 'low' },
    { label: 'Catégorie', value: category?.name ?? '—', conf: category ? 'med' : 'low' },
    { label: 'Compte', value: account?.name ?? 'À choisir', conf: resolved ? 'high' : 'low' },
    { label: 'Date', value: "Aujourd'hui", conf: 'high' },
  ]

  return { transcript, fields, prefill, resolved }
}
