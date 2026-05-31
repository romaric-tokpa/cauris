import type { ReactNode } from 'react'
import { Icon, type IconName } from '../../components/primitives'
import { money } from '../../lib/money'
import styles from './onboarding.module.css'

interface OnbStepProps {
  step: number
  title: string
  sub?: string
  cta?: string
  skip?: boolean
  ctaDisabled?: boolean
  onBack?: () => void
  onSkip?: () => void
  onNext: () => void
  children: ReactNode
}

/** Coquille d'une étape — portée 1:1 de OnbStep (screens-onboarding.jsx). */
export function OnbStep({
  step,
  title,
  sub,
  cta = 'Continuer',
  skip = true,
  ctaDisabled,
  onBack,
  onSkip,
  onNext,
  children,
}: OnbStepProps) {
  return (
    <form
      className={styles.step}
      onSubmit={(e) => {
        e.preventDefault()
        onNext()
      }}
    >
      <div className={styles.head}>
        <button
          type="button"
          className={`icon-btn ${styles.iconBtnSm}`}
          aria-label="Précédent"
          onClick={onBack}
          disabled={!onBack}
        >
          <span className={styles.backGlyph}>
            <Icon name="chevron" size={16} />
          </span>
        </button>
        <span className={`t-faint ${styles.count}`}>Étape {step} sur 5</span>
        {skip ? (
          <button type="button" className={`card-link ${styles.skipLink}`} onClick={onSkip}>
            Passer
          </button>
        ) : (
          <span className={styles.skipSpacer} />
        )}
      </div>

      <div className={`steps ${styles.stepsBar}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <i key={i} className={i <= step ? 'on' : ''} />
        ))}
      </div>

      <div className={styles.titleBlock}>
        <div className={styles.title}>{title}</div>
        {sub && <div className={`t-faint ${styles.sub}`}>{sub}</div>}
      </div>

      <div className={styles.body}>{children}</div>

      <button type="submit" className={`btn primary block ${styles.cta}`} disabled={ctaDisabled}>
        {cta}
      </button>
    </form>
  )
}

interface ChoiceProps {
  icon: IconName
  label: string
  sub?: string
  selected: boolean
  onToggle: () => void
}

/** Choix multi-sélection (ligne) — porté 1:1 de Choice. */
export function Choice({ icon, label, sub, selected, onToggle }: ChoiceProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      className={'choice' + (selected ? ' on' : '')}
      onClick={onToggle}
    >
      <div className="set-ico">
        <Icon name={icon} size={18} />
      </div>
      <div className={styles.choiceText}>
        <div className={styles.choiceLabel}>{label}</div>
        {sub && <div className={`t-faint ${styles.choiceSub}`}>{sub}</div>}
      </div>
      <div className={'checkbox' + (selected ? ' on' : '')} aria-hidden="true">
        {selected && <Icon name="check" size={14} />}
      </div>
    </button>
  )
}

/** Choix unique en carte verticale (étape 4) — porté 1:1 du wireframe. */
export function ChoiceCard({
  icon,
  label,
  selected,
  onSelect,
}: {
  icon: IconName
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`choice ${styles.choiceCard}${selected ? ' on' : ''}`}
      onClick={onSelect}
    >
      <Icon name={icon} size={20} className={selected ? styles.cardIconOn : 't-faint'} />
      <span className={styles.cardLabel}>{label}</span>
    </button>
  )
}

/** Champ montant (`.inp.big`) avec vrai input mono ; formatage via money(). */
export function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <label>
      <span className="lbl">{label}</span>
      <div className="inp big">
        <input
          inputMode="numeric"
          className={styles.moneyInput}
          value={money(value)}
          onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
        />
        <span className="kpi-cur">FCFA</span>
      </div>
    </label>
  )
}

/** Bannière d'erreur soignée. */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="alert over" role="alert">
      <i className="swatch" />
      <div className={styles.alertText}>{message}</div>
    </div>
  )
}
