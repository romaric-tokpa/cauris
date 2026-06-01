import { useState } from 'react'
import { Card } from '../../components/ui'
import { money } from '../../lib/money'
import { MoneyInput, ErrorBanner } from '../onboarding/parts'
import { SelectField } from '../transactions/parts'
import type { AccountRef } from '../transactions/useTransactions'
import { useContributionMutations, type GoalRow } from './useObjectifs'
import styles from './objectifs.module.css'

/** Jour de référence produit (currentDate) — date par défaut d'une contribution. */
const TODAY = '2026-06-01'

interface Props {
  goal: GoalRow
  accounts: AccountRef[]
  onClose: () => void
}

/** Formulaire « Ajouter une contribution » — porté du drawer de ObjDetailDesk
 *  (Montant / Compte source / Date). Le toggle « Rendre récurrent » est omis
 *  (pas de récurrence en base → contrôle mort évité). */
export function ContributionForm({ goal, accounts, onClose }: Props) {
  const [amount, setAmount] = useState(0)
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [occurredAt, setOccurredAt] = useState(TODAY)
  const [error, setError] = useState('')
  const { create } = useContributionMutations(goal.id)
  const submitting = create.isPending

  const accountOpts = [
    { value: '', label: 'Aucun' },
    ...accounts.map((a) => ({ value: a.id, label: a.name })),
  ]

  const submit = () => {
    setError('')
    if (!Number.isInteger(amount) || amount <= 0) return setError('Montant positif requis.')
    create.mutate(
      { accountId: accountId || null, amount, occurredAt },
      {
        onSuccess: onClose,
        onError: (e: unknown) => setError(e instanceof Error ? e.message : 'Échec de l’ajout.'),
      },
    )
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

      {/* rappel de l'objectif ciblé */}
      <Card soft pad="pad-sm" className={`r between ${styles.goalSummary}`}>
        <span className={styles.goalSummaryName}>{goal.name}</span>
        <span className={`t-mono t-faint ${styles.goalSummaryMeta}`}>
          {goal.pct} % · reste {money(goal.reste)}
        </span>
      </Card>

      <MoneyInput label="Montant" value={amount} onChange={setAmount} />
      <SelectField
        label="Compte source"
        value={accountId}
        options={accountOpts}
        onChange={setAccountId}
      />
      <label>
        <span className="lbl">Date</span>
        <div className="inp">
          <input
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            aria-label="Date"
          />
        </div>
      </label>

      <div className={styles.drawerActions}>
        <button type="button" className="btn block" onClick={onClose} disabled={submitting}>
          Annuler
        </button>
        <button type="submit" className="btn primary block" disabled={submitting}>
          {submitting ? 'Ajout…' : 'Contribuer'}
        </button>
      </div>
    </form>
  )
}
