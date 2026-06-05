import { useState } from 'react'
import { Icon } from '../../components/primitives'
import { type AccountRef, type CategoryRef } from './useTransactions'
import {
  simulateTranscription,
  extractDraft,
  todayIso,
  type VoiceDraft,
  type VoicePrefill,
} from '../../lib/voiceStub'
import { DraftReview } from './DraftReview'
import styles from './transactions.module.css'

/**
 * Capture vocale (Lot B2) — flux RÉEL derrière un STT SIMULÉ (cf. `voiceStub`).
 * Deux étapes dans le même drawer/sheet : `record` (simulation honnête, jamais de faux
 * « écoute en cours ») → `result` (« Vérifier la transaction »). Le panneau de revue
 * (champs + confiance + Corriger/Valider) est le composant PARTAGÉ `DraftReview` (réutilisé
 * tel quel par la saisie conversationnelle B3).
 */
export function VoiceCapture({
  accounts,
  categories,
  onCorrect,
  onClose,
}: {
  accounts: AccountRef[]
  categories: CategoryRef[]
  /** Corriger → ouvre le formulaire B1 pré-rempli avec le brouillon. */
  onCorrect: (prefill: VoicePrefill) => void
  onClose: () => void
}) {
  const [step, setStep] = useState<'record' | 'result'>('record')
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState<VoiceDraft | null>(null)

  // Lance la transcription SIMULÉE puis l'extraction RÉELLE → étape de vérification.
  const run = async () => {
    setBusy(true)
    const transcript = await simulateTranscription()
    setDraft(extractDraft(transcript, accounts, categories, todayIso()))
    setBusy(false)
    setStep('result')
  }

  if (step === 'record') {
    return (
      <div className={styles.voiceCol}>
        {/* Honnêteté du stub : badge explicite + sous-texte, JAMAIS « écoute en cours ». */}
        <div className={`r ${styles.simHead}`}>
          <span className={styles.simBadge}>
            <span className={styles.simDot} /> Simulation
          </span>
          <span className="t-faint">Démo · sans micro réel</span>
        </div>

        <div className={styles.voiceStage}>
          <div className={`row-ico ${styles.voiceMic}`}>
            <Icon name="mic" size={26} />
          </div>
          <div className={styles.voiceWave} aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <div className={`t-faint ${styles.voiceStageNote}`}>
            La transcription est simulée (phrase de démonstration). Lancez-la, puis vérifiez
            et corrigez avant d'enregistrer.
          </div>
        </div>

        <button
          type="button"
          className="btn primary block"
          onClick={() => void run()}
          disabled={busy}
        >
          <Icon name="mic" size={16} /> {busy ? 'Transcription…' : 'Lancer la simulation'}
        </button>
        <button type="button" className="btn block" onClick={onClose} disabled={busy}>
          Annuler
        </button>
      </div>
    )
  }

  // step === 'result'
  if (!draft) return null
  return (
    <div className={styles.voiceCol}>
      <div className={styles.voiceTitle}>Vérifier la transaction</div>

      {/* Transcription (simulée) — l'origine est explicite. */}
      <div className={`wf-card soft wf-pad-sm r ${styles.dictee}`}>
        <div className={`ai-av ${styles.dicteeAv}`}>C</div>
        <div>
          <div className="t-faint">Dicté (simulé)</div>
          <div className={styles.dicteeText}>« {draft.transcript} »</div>
        </div>
      </div>

      <DraftReview draft={draft} onCorrect={onCorrect} onClose={onClose} />
    </div>
  )
}
