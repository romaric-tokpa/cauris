import { Icon } from '../../components/primitives'
import styles from './transactions.module.css'

export interface SelectOption {
  value: string
  label: string
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
