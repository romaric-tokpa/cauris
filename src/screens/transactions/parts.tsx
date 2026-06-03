import { Icon } from '../../components/primitives'
import { TABS } from './helpers'
import styles from './transactions.module.css'

export interface SelectOption {
  value: string
  label: string
}

/** Sous-nav desktop (`.subnav`/`.si`) — partagée liste transactions ↔ vue récurrences. */
export function TxnSubnav({ active, onSelect }: { active: string; onSelect: (v: string) => void }) {
  return (
    <div className="subnav">
      {TABS.map((t) => (
        <span
          key={t.label}
          className={'si' + (active === t.value ? ' on' : '')}
          role="button"
          aria-pressed={active === t.value}
          tabIndex={0}
          onClick={() => onSelect(t.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(t.value)}
        >
          {t.label}
        </span>
      ))}
    </div>
  )
}

/** Sous-nav mobile (chips) — partagée liste transactions ↔ vue récurrences. */
export function TxnChips({ active, onSelect }: { active: string; onSelect: (v: string) => void }) {
  return (
    <div className={`r ${styles.mobChips} ${styles.g7}`}>
      {TABS.map((t) => (
        <span
          key={t.label}
          className={'chip ' + styles.mobChip + (active === t.value ? ' on' : '')}
          role="button"
          aria-pressed={active === t.value}
          tabIndex={0}
          onClick={() => onSelect(t.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(t.value)}
        >
          {t.label}
        </span>
      ))}
    </div>
  )
}

/** Sélecteur de formulaire : `.inp` (texte + chevron) avec un <select> natif invisible. */
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  options: SelectOption[]
  onChange: (v: string) => void
  placeholder?: string
}) {
  const current = options.find((o) => o.value === value)
  return (
    <label>
      <span className="lbl">{label}</span>
      <div className={`inp ${styles.selectWrap}`}>
        <span>{current?.label ?? placeholder ?? '—'}</span>
        <Icon name="chevron" size={15} className="t-faint" />
        <select
          className={styles.selectNative}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  )
}

/** Chip de filtre : look `.chip` + `<select>` natif invisible (URL-bound). */
export function FilterChip({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: SelectOption[]
  onChange: (v: string) => void
}) {
  const current = options.find((o) => o.value === value)
  return (
    <span className={`chip ${styles.selectWrap}`}>
      {label} : {current?.label ?? options[0]?.label ?? 'Tous'}{' '}
      <Icon name="chevron" size={13} />
      <select
        className={styles.selectNative}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  )
}
