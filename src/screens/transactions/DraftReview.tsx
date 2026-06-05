import { useState } from 'react'
import { Icon } from '../../components/primitives'
import { ErrorBanner } from '../onboarding/parts'
import { useTxnMutations, type TxnWritePayload } from './useTransactions'
import type { VoiceDraft, VoicePrefill, Confidence } from '../../lib/voiceStub'
import styles from './transactions.module.css'

const CONF_LABEL: Record<Confidence, string> = {
  high: 'Sûr',
  med: 'À vérifier',
  low: 'Incertain',
}

/**
 * Panneau de revue d'un BROUILLON extrait — **PARTAGÉ** par la note vocale (B2) et la
 * saisie conversationnelle (B3). Champs extraits + confiances + garde anti-inerte +
 * Corriger / Valider. Porte la mutation de création : la validation explicite (clic
 * Valider) est la SEULE voie de création. Désactivée tant que le compte n'est pas
 * résolu (texte libre ⇒ cas normal) → on oriente vers Corriger.
 *
 * Libellés des boutons paramétrables (voix : Corriger/Valider ; chat : Modifier/Enregistrer).
 */
export function DraftReview({
  draft,
  onCorrect,
  onClose,
  correctLabel = 'Corriger',
  validateLabel = 'Valider',
}: {
  draft: VoiceDraft
  /** Corriger → ouvre le formulaire B1 pré-rempli avec le brouillon. */
  onCorrect: (prefill: VoicePrefill) => void
  onClose: () => void
  correctLabel?: string
  validateLabel?: string
}) {
  const [error, setError] = useState('')
  const { create } = useTxnMutations()

  const onValidate = () => {
    if (!draft.resolved) return
    const p = draft.prefill
    const payload: TxnWritePayload = {
      type: p.type,
      label: p.label,
      note: null,
      amount: p.amount,
      accountId: p.accountId,
      categoryId: p.categoryId || null,
      transferAccountId: null,
      occurredAt: p.occurredAt,
      channel: p.channel,
    }
    create.mutate(payload, {
      onSuccess: onClose,
      onError: (e) => setError(e instanceof Error ? e.message : 'Erreur réseau.'),
    })
  }

  return (
    <div className={styles.reviewCol}>
      {error && <ErrorBanner message={error} />}

      <div className="t-eyebrow">Champs extraits</div>
      <div className={`wf-card wf-pad-sm ${styles.fields}`}>
        {draft.fields.map((f) => (
          <div className={`row-line ${styles.fieldRow}`} key={f.label}>
            <div className={styles.fieldText}>
              <div className={`t-faint ${styles.fieldLabel}`}>{f.label}</div>
              <div className={f.label === 'Montant' ? `t-mono ${styles.fieldVal}` : styles.fieldVal}>
                {f.value}
              </div>
            </div>
            <span className={`${styles.conf} ${styles[`conf_${f.conf}`]}`}>
              <span className={styles.confDot} /> {CONF_LABEL[f.conf]}
            </span>
          </div>
        ))}
      </div>

      {/* Garde anti-inerte : compte non résolu → Valider désactivé + renvoi vers Corriger. */}
      {!draft.resolved && (
        <div className={`r ${styles.voiceHint}`}>
          <Icon name="alert" size={14} className="t-warn" />
          <span>Compte non reconnu — complétez-le via « {correctLabel} » avant d'enregistrer.</span>
        </div>
      )}

      <div className={styles.drawerActions}>
        <button
          type="button"
          className="btn block"
          onClick={() => onCorrect(draft.prefill)}
          disabled={create.isPending}
        >
          <Icon name="edit" size={15} /> {correctLabel}
        </button>
        <button
          type="button"
          className="btn primary block"
          onClick={onValidate}
          disabled={!draft.resolved || create.isPending}
          title={draft.resolved ? undefined : `Choisissez un compte via « ${correctLabel} »`}
        >
          {create.isPending ? 'Enregistrement…' : validateLabel}
        </button>
      </div>
    </div>
  )
}
