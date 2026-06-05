import { useState } from 'react'
import { Icon } from '../../components/primitives'
import { money } from '../../lib/money'
import {
  extractDraft,
  todayIso,
  SIMULATED_SMS,
  type SmsMessage,
  type VoicePrefill,
} from '../../lib/voiceStub'
import { DraftReview } from './DraftReview'
import type { AccountRef, CategoryRef } from './useTransactions'
import styles from './transactions.module.css'

/**
 * Capture depuis un SMS (Lot B5) — boîte SMS SIMULÉE (aucune lecture réelle ; permissions
 * Android inexistantes en web, cf. `voiceStub`). Chaque SMS est une proposition AUTO-CAPTURÉE
 * que l'utilisateur vérifie : `extractDraft` réutilisé → `DraftReview` partagé (Modifier/Ajouter)
 * → validation explicite → transaction (canal B1). Badge « Simulation » honnête comme B2.
 */
export function SmsCapture({
  accounts,
  categories,
  onCorrect,
  onClose,
}: {
  accounts: AccountRef[]
  categories: CategoryRef[]
  onCorrect: (prefill: VoicePrefill) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<SmsMessage | null>(null)

  if (selected) {
    const draft = extractDraft(selected.raw, accounts, categories, todayIso())
    return (
      <div className={styles.voiceCol}>
        <button type="button" className={styles.smsBack} onClick={() => setSelected(null)}>
          <Icon name="chevron" size={14} className={styles.smsBackIco} /> SMS détectés
        </button>
        <div className={`wf-card soft wf-pad-sm ${styles.smsRawCard}`}>
          <div className="t-faint">
            SMS · {selected.from} · {selected.when}
          </div>
          <div className={styles.smsRaw}>« {selected.raw} »</div>
        </div>
        <DraftReview
          draft={draft}
          onCorrect={onCorrect}
          onClose={onClose}
          correctLabel="Modifier"
          validateLabel="Ajouter"
        />
      </div>
    )
  }

  return (
    <div className={styles.voiceCol}>
      {/* Honnêteté du stub : badge explicite, AUCUNE lecture SMS réelle. */}
      <div className={`r ${styles.simHead}`}>
        <span className={styles.simBadge}>
          <span className={styles.simDot} /> Simulation
        </span>
        <span className="t-faint">Démo : SMS simulé, sans lecture réelle</span>
      </div>

      <div className={`wf-card soft wf-pad-sm r ${styles.smsHeadCard}`}>
        <div className={`row-ico ${styles.smsHeadIco}`}>
          <Icon name="phone" size={16} />
        </div>
        <div>
          <div className={styles.smsHeadTitle}>Lecture SMS activée</div>
          <div className="t-faint">
            Fonctionnalité complémentaire — l'app reste complète sans elle ; vous validez chaque
            proposition.
          </div>
        </div>
      </div>

      <div className="t-eyebrow">{SIMULATED_SMS.length} opérations proposées</div>
      <div className={styles.smsList}>
        {SIMULATED_SMS.map((s, i) => {
          const p = extractDraft(s.raw, accounts, categories, todayIso()).prefill
          const signed = p.type === 'Revenu' ? p.amount : -p.amount
          return (
            <div className={`wf-card wf-pad-sm ${styles.smsCard}`} key={i}>
              <div className="r between">
                <span className={`r ${styles.smsFrom}`}>
                  <span className="tag-cat">{s.from}</span>
                  <span className="t-faint">{s.when}</span>
                </span>
                <span className={`row-amt ${styles.smsAmt}${signed > 0 ? ' t-pos' : ''}`}>
                  {signed > 0 ? '+' : ''}
                  {money(signed)}
                </span>
              </div>
              <div className={styles.smsRaw}>« {s.raw} »</div>
              <div className={`r between ${styles.smsCardFoot}`}>
                <span className={styles.smsTag}>Auto-capturé</span>
                <button
                  type="button"
                  className={`btn primary ${styles.smsVerify}`}
                  onClick={() => setSelected(s)}
                >
                  Vérifier
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
