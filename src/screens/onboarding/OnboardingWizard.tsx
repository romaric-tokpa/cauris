import { useEffect, useReducer, useState } from 'react'
import { Icon } from '../../components/primitives'
import { money } from '../../lib/money'
import { authClient } from '../../lib/auth-client'
import { OnbStep, Choice, ChoiceCard, MoneyInput, ErrorBanner } from './parts'
import styles from './onboarding.module.css'

/**
 * Wizard onboarding 5 étapes (parcours 1). État + progression persistés en
 * localStorage (reprise après refresh). NB : les données financières saisies ne
 * sont PAS persistées en base (pas de table métier — Phase 3) ; seule la
 * complétion (flag user onboardingComplete) est enregistrée côté serveur.
 */
interface WizardState {
  step: number
  prenom: string
  objectives: string[]
  revenu: number
  depenses: number
  objectif: string
  montantCible: number
  comptes: string[]
}

// Valeurs pré-remplies = état du wireframe.
const INITIAL: WizardState = {
  step: 1,
  prenom: 'Aïcha',
  objectives: ['epargner', 'budgets', 'comprendre'],
  revenu: 850000,
  depenses: 600000,
  objectif: 'urgence',
  montantCible: 2000000,
  comptes: ['courant', 'epargne', 'om'],
}

type Action =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'patch'; patch: Partial<WizardState> }
  | { type: 'toggleArray'; key: 'objectives' | 'comptes'; id: string }

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'next':
      return { ...state, step: Math.min(5, state.step + 1) }
    case 'prev':
      return { ...state, step: Math.max(1, state.step - 1) }
    case 'patch':
      return { ...state, ...action.patch }
    case 'toggleArray': {
      const arr = state[action.key]
      const next = arr.includes(action.id)
        ? arr.filter((x) => x !== action.id)
        : [...arr, action.id]
      return { ...state, [action.key]: next }
    }
  }
}

const STORAGE_KEY = 'cauris-onboarding'

function load(): WizardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (parsed && typeof parsed === 'object')
        return { ...INITIAL, ...(parsed as Partial<WizardState>) }
    }
  } catch {
    return INITIAL
  }
  return INITIAL
}

export function OnboardingWizard() {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* stockage indisponible — on ignore */
    }
  }, [state])

  const patch = (p: Partial<WizardState>) => dispatch({ type: 'patch', patch: p })
  const toggle = (key: 'objectives' | 'comptes', id: string) =>
    dispatch({ type: 'toggleArray', key, id })
  const has = (key: 'objectives' | 'comptes', id: string) => state[key].includes(id)

  const complete = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        setError('Impossible de finaliser l’onboarding. Réessayez.')
        setSubmitting(false)
        return
      }
      // CRITIQUE : refetch session fraîche (cache cookie désactivé) et exiger
      // onboardingComplete=true AVANT de naviguer, sinon boucle de garde (sous-bloc D).
      const fresh = await authClient.getSession({ query: { disableCookieCache: true } })
      const user = fresh.data?.user as { onboardingComplete?: boolean } | undefined
      if (!user?.onboardingComplete) {
        setError('Session non synchronisée. Réessayez.')
        setSubmitting(false)
        return
      }
      localStorage.removeItem(STORAGE_KEY)
      // Rechargement complet : la garde repart d'une session fraîche (onboardé) → /.
      window.location.assign('/')
    } catch {
      setError('Erreur réseau. Réessayez.')
      setSubmitting(false)
    }
  }

  const onNext = () => {
    if (state.step === 5) void complete()
    else dispatch({ type: 'next' })
  }
  const onBack = state.step > 1 ? () => dispatch({ type: 'prev' }) : undefined
  const onSkip = onNext
  const nav = { onNext, onBack, onSkip }

  return (
    <div className={styles.screen}>
      <div className={styles.panel}>
        {state.step === 1 && (
          <OnbStep
            step={1}
            title="Bienvenue, parlons de vous"
            sub="Ces infos personnalisent votre tableau de bord."
            skip={false}
            {...nav}
          >
            <div className={styles.avatarWrap}>
              <div className={styles.avatarRel}>
                <div className={`avatar ${styles.avatarLg}`}>
                  {state.prenom.trim().charAt(0).toUpperCase() || 'A'}
                </div>
                <button
                  type="button"
                  className={`icon-btn ${styles.avatarEdit}`}
                  aria-label="Modifier la photo"
                >
                  <Icon name="edit" size={14} />
                </button>
              </div>
            </div>
            <label>
              <span className="lbl">Prénom</span>
              <div className="inp">
                <input
                  value={state.prenom}
                  onChange={(e) => patch({ prenom: e.target.value })}
                  autoComplete="given-name"
                />
              </div>
            </label>
            <div>
              <span className="lbl">Pays</span>
              <div className="inp">
                <span>Côte d’Ivoire</span>
                <Icon name="chevron" size={15} className="t-faint" />
              </div>
            </div>
            <div>
              <span className="lbl">Devise</span>
              <div className="inp">
                <span>FCFA (XOF)</span>
                <Icon name="chevron" size={15} className="t-faint" />
              </div>
            </div>
          </OnbStep>
        )}

        {state.step === 2 && (
          <OnbStep
            step={2}
            title="Quels sont vos objectifs ?"
            sub="Sélectionnez tout ce qui vous correspond."
            {...nav}
          >
            <Choice
              icon="target"
              label="Épargner régulièrement"
              selected={has('objectives', 'epargner')}
              onToggle={() => toggle('objectives', 'epargner')}
            />
            <Choice
              icon="gauge"
              label="Suivre mes budgets"
              selected={has('objectives', 'budgets')}
              onToggle={() => toggle('objectives', 'budgets')}
            />
            <Choice
              icon="bank"
              label="Rembourser une dette"
              selected={has('objectives', 'dette')}
              onToggle={() => toggle('objectives', 'dette')}
            />
            <Choice
              icon="analytics"
              label="Mieux comprendre mes dépenses"
              selected={has('objectives', 'comprendre')}
              onToggle={() => toggle('objectives', 'comprendre')}
            />
          </OnbStep>
        )}

        {state.step === 3 && (
          <OnbStep
            step={3}
            title="Vos revenus et dépenses"
            sub="Une estimation suffit — vous pourrez l’affiner plus tard."
            {...nav}
          >
            <MoneyInput
              label="Revenu mensuel net"
              value={state.revenu}
              onChange={(v) => patch({ revenu: v })}
            />
            <MoneyInput
              label="Dépenses mensuelles estimées"
              value={state.depenses}
              onChange={(v) => patch({ depenses: v })}
            />
            <div className={`wf-card soft wf-pad-sm r ${styles.capacityCard}`}>
              <Icon name="target" size={18} className="t-pos" />
              <span className={styles.capacityText}>
                Capacité d’épargne estimée :{' '}
                <b className="t-mono">~{money(Math.max(0, state.revenu - state.depenses))} FCFA</b>{' '}
                / mois.
              </span>
            </div>
          </OnbStep>
        )}

        {state.step === 4 && (
          <OnbStep
            step={4}
            title="Votre premier objectif"
            sub="Donnez-vous une cible pour rester motivée."
            {...nav}
          >
            <div className={styles.cardRow}>
              <ChoiceCard
                icon="shield"
                label="Fonds d’urgence"
                selected={state.objectif === 'urgence'}
                onSelect={() => patch({ objectif: 'urgence' })}
              />
              <ChoiceCard
                icon="target"
                label="Voyage"
                selected={state.objectif === 'voyage'}
                onSelect={() => patch({ objectif: 'voyage' })}
              />
            </div>
            <MoneyInput
              label="Montant cible"
              value={state.montantCible}
              onChange={(v) => patch({ montantCible: v })}
            />
            <div>
              <span className="lbl">Date cible</span>
              <div className="inp">
                <span>Décembre 2026</span>
                <Icon name="calendar" size={15} className="t-faint" />
              </div>
            </div>
          </OnbStep>
        )}

        {state.step === 5 && (
          <OnbStep
            step={5}
            title="Ajoutez vos comptes"
            sub="Suivez tout au même endroit. Vous pourrez en ajouter d’autres."
            cta={submitting ? 'Finalisation…' : 'Terminer'}
            ctaDisabled={submitting}
            {...nav}
          >
            {error && <ErrorBanner message={error} />}
            <Choice
              icon="wallet"
              label="Compte courant"
              sub="NSIA Banque"
              selected={has('comptes', 'courant')}
              onToggle={() => toggle('comptes', 'courant')}
            />
            <Choice
              icon="target"
              label="Épargne"
              sub="Ecobank"
              selected={has('comptes', 'epargne')}
              onToggle={() => toggle('comptes', 'epargne')}
            />
            <Choice
              icon="card"
              label="Orange Money"
              sub="Mobile money"
              selected={has('comptes', 'om')}
              onToggle={() => toggle('comptes', 'om')}
            />
            <Choice
              icon="card"
              label="Wave"
              sub="Mobile money"
              selected={has('comptes', 'wave')}
              onToggle={() => toggle('comptes', 'wave')}
            />
            <button type="button" className={`btn block ${styles.addBtn}`}>
              <Icon name="plus" size={15} /> Ajouter manuellement
            </button>
          </OnbStep>
        )}
      </div>
    </div>
  )
}
