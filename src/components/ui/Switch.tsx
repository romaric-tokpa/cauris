/** Interrupteur on/off — `.switch`/`.switch.on` (components.css), porté du Switch
 *  interne de ThemeControls. `role="switch"` + `aria-checked` (a11y). `disabled` →
 *  visiblement inactif (`.switch:disabled`), non interactif : sert les réglages
 *  « à venir » sans jamais faire croire à un toggle fonctionnel. */
export interface SwitchProps {
  on: boolean
  /** Libellé accessible (le visuel n'a pas de texte). */
  label: string
  onChange?: (v: boolean) => void
  disabled?: boolean
  /** Infobulle (ex. « Bientôt disponible » pour un réglage à venir). */
  title?: string
}

export function Switch({ on, label, onChange, disabled = false, title }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      title={title}
      disabled={disabled}
      className={'switch' + (on ? ' on' : '')}
      onClick={disabled ? undefined : () => onChange?.(!on)}
    >
      <i />
    </button>
  )
}
