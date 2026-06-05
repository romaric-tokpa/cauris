import { useMemo, useState } from 'react'
import { Icon } from '../../components/primitives'
import { money } from '../../lib/money'
import { amortizeAllInclusive } from '../../lib/loanSim'
import { MoneyInput, ErrorBanner } from '../onboarding/parts'
import { useLoanMutations, type LoanRow, type LoanWritePayload } from './useLoans'
import styles from './pret.module.css'

interface FormState {
  name: string
  kind: string
  principal: number
  ratePct: string // % nominal (ex. « 7.5 »)
  termMonths: number
  monthlyPayment: number
  firstDueDate: string
  taxPct: string // taxe sur intérêts (%)
  insurancePct: string // assurance %/an
  feesUpfront: number
  firstPeriodDays: number
}

const pctToBps = (s: string): number => Math.round((Number(s.replace(',', '.')) || 0) * 100)

function initialState(initial: LoanRow | undefined): FormState {
  return {
    name: initial?.name ?? '',
    kind: initial?.kind ?? '',
    principal: initial?.principal ?? 0,
    ratePct: initial ? String(initial.rateBps / 100) : '',
    termMonths: initial?.termMonths ?? 0,
    monthlyPayment: initial?.monthlyPayment ?? 0,
    firstDueDate: initial?.firstDueDate ?? '2026-07-25',
    taxPct: initial ? String(initial.taxBps / 100) : '',
    insurancePct: initial ? String(initial.insuranceBps / 100) : '',
    feesUpfront: initial?.feesUpfront ?? 0,
    firstPeriodDays: 30,
  }
}

/**
 * Formulaire prêt (Drawer/Sheet) — HORS WIREFRAME, calqué sur `AccountForm`. La MATH de
 * l'échéancier est calculée CLIENT (`amortizeAllInclusive`, testée au franc près) et
 * prévisualisée ; le serveur valide les invariants. Anti-bouton-mort.
 */
export function LoanForm({
  initial,
  onClose,
  onExit,
}: {
  initial?: LoanRow
  onClose: () => void
  onExit?: () => void
}) {
  const [s, setS] = useState<FormState>(() => initialState(initial))
  const [error, setError] = useState('')
  const { create, update, archive, remove } = useLoanMutations()
  const isEdit = Boolean(initial)
  const submitting = create.isPending || update.isPending || archive.isPending || remove.isPending
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setS((p) => ({ ...p, [k]: v }))
  const exit = onExit ?? onClose

  // Échéancier calculé en direct (aperçu). Invalide si la mensualité n'amortit pas.
  const sched = useMemo(() => {
    if (s.principal <= 0 || s.termMonths <= 0 || s.monthlyPayment <= 0) return null
    const r = amortizeAllInclusive({
      principal: s.principal,
      payment: s.monthlyPayment,
      rateBps: pctToBps(s.ratePct),
      taxBps: pctToBps(s.taxPct),
      insuranceBps: pctToBps(s.insurancePct),
      term: s.termMonths,
      firstPeriodDays: s.firstPeriodDays,
      fees: s.feesUpfront,
    })
    const regular = r.lines.filter((l) => l.n >= 1)
    const ok = regular.every((l, i) => (i === regular.length - 1 ? true : l.principal > 0))
    return ok ? r : null
  }, [s])

  const onErr = (e: unknown) => setError(e instanceof Error ? e.message : 'Erreur réseau.')

  const submit = () => {
    setError('')
    if (!s.name.trim()) return setError('Nom du prêt requis.')
    if (!sched) return setError('Mensualité insuffisante pour amortir ce capital sur la durée.')
    const payload: LoanWritePayload = {
      name: s.name.trim(),
      kind: s.kind.trim(),
      principal: s.principal,
      rateBps: pctToBps(s.ratePct),
      taxBps: pctToBps(s.taxPct),
      insuranceBps: pctToBps(s.insurancePct),
      feesUpfront: s.feesUpfront,
      termMonths: s.termMonths,
      monthlyPayment: s.monthlyPayment,
      firstDueDate: s.firstDueDate,
      firstPeriodDays: s.firstPeriodDays,
      schedule: sched.lines,
    }
    if (isEdit && initial)
      update.mutate({ id: initial.id, data: payload }, { onSuccess: onClose, onError: onErr })
    else create.mutate(payload, { onSuccess: onClose, onError: onErr })
  }

  const onArchive = () => {
    if (!initial) return
    setError('')
    archive.mutate(initial.id, { onSuccess: exit, onError: onErr })
  }
  const onDelete = () => {
    if (!initial) return
    setError('')
    remove.mutate(initial.id, { onSuccess: exit, onError: onErr })
  }

  return (
    <form
      className={styles.formFields}
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      {error && <ErrorBanner message={error} />}

      <label>
        <span className="lbl">Nom du prêt</span>
        <div className="inp">
          <input value={s.name} onChange={(e) => set('name', e.target.value)} placeholder="Prêt auto SGCI…" autoFocus /> {/* prettier-ignore */}
        </div>
      </label>
      <label>
        <span className="lbl">Type</span>
        <div className="inp">
          <input value={s.kind} onChange={(e) => set('kind', e.target.value)} placeholder="Auto, Immobilier…" /> {/* prettier-ignore */}
        </div>
      </label>

      <div className={styles.formGrid}>
        <MoneyInput label="Montant emprunté" value={s.principal} onChange={(v) => set('principal', v)} />
        <MoneyInput label="Mensualité (tout-compris)" value={s.monthlyPayment} onChange={(v) => set('monthlyPayment', v)} /> {/* prettier-ignore */}
      </div>
      <div className={styles.formGrid}>
        <Pct label="Taux nominal (%/an)" value={s.ratePct} onChange={(v) => set('ratePct', v)} />
        <label>
          <span className="lbl">Durée (échéances)</span>
          <div className="inp">
            <input
              type="number"
              inputMode="numeric"
              value={s.termMonths || ''}
              onChange={(e) => set('termMonths', Number(e.target.value) || 0)}
            />
          </div>
        </label>
      </div>
      <label>
        <span className="lbl">Date de 1ʳᵉ échéance</span>
        <div className="inp">
          <input type="date" value={s.firstDueDate} onChange={(e) => set('firstDueDate', e.target.value)} /> {/* prettier-ignore */}
        </div>
      </label>

      {/* Options « tout-compris » (laisser à 0 pour un prêt simple). */}
      <div className={styles.formGrid}>
        <Pct label="Taxe sur intérêts (%)" value={s.taxPct} onChange={(v) => set('taxPct', v)} />
        <Pct label="Assurance (%/an)" value={s.insurancePct} onChange={(v) => set('insurancePct', v)} />
      </div>
      <div className={styles.formGrid}>
        <MoneyInput label="Frais de dossier" value={s.feesUpfront} onChange={(v) => set('feesUpfront', v)} />
        <label>
          <span className="lbl">Jours 1ʳᵉ période</span>
          <div className="inp">
            <input
              type="number"
              inputMode="numeric"
              value={s.firstPeriodDays || ''}
              onChange={(e) => set('firstPeriodDays', Number(e.target.value) || 0)}
            />
          </div>
        </label>
      </div>

      {/* Aperçu de l'échéancier (calcul client). */}
      {sched && (
        <div className={`wf-card soft wf-pad-sm ${styles.preview}`}>
          <div className={`r between ${styles.previewRow}`}>
            <span className="t-muted">Échéances</span>
            <span className="t-mono">{s.termMonths}</span>
          </div>
          <div className={`r between ${styles.previewRow}`}>
            <span className="t-muted">Total intérêts</span>
            <span className="t-mono">{money(sched.totals.interest)} FCFA</span>
          </div>
          <div className={`r between ${styles.previewRow}`}>
            <span className="t-muted">Coût total (échéances)</span>
            <span className="t-mono">{money(sched.totals.payments)} FCFA</span>
          </div>
        </div>
      )}

      {isEdit && (
        <>
          <button type="button" className={`btn block ${styles.archiveBtn}`} onClick={onArchive} disabled={submitting}>
            <Icon name="inbox" size={15} /> Archiver ce prêt
          </button>
          <button type="button" className={`btn block ${styles.deleteBtn}`} onClick={onDelete} disabled={submitting}>
            <Icon name="trash" size={15} /> Supprimer ce prêt
          </button>
        </>
      )}

      <div className={styles.drawerActions}>
        <button type="button" className="btn block" onClick={onClose} disabled={submitting}>
          Annuler
        </button>
        <button type="submit" className="btn primary block" disabled={submitting}>
          {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter le prêt'}
        </button>
      </div>
    </form>
  )
}

/** Champ pourcentage (saisie libre « 7.5 »). */
function Pct({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label>
      <span className="lbl">{label}</span>
      <div className="inp">
        <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0" />
      </div>
    </label>
  )
}
