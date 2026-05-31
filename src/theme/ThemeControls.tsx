import { Drawer } from '../components/ui'
import { useTheme, ACCENTS } from './themeContext'
import styles from './ThemeControls.module.css'

function Switch({
  label,
  on,
  onChange,
}: {
  label: string
  on: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="set-row">
      <span className={styles.rowLabel}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={'switch' + (on ? ' on' : '')}
        onClick={() => onChange(!on)}
      >
        <i />
      </button>
    </div>
  )
}

/** Panneau « Apparence » (tiroir) : sombre / glass / accent / accent-nav,
 *  câblé sur useTheme(). Ouvert depuis le header. */
export function ThemeControls({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTheme()
  return (
    <Drawer open={open} onClose={onClose} title="Apparence">
      <Switch label="Mode sombre" on={t.dark} onChange={t.setDark} />
      <Switch label="Verre dépoli (Liquid Glass)" on={t.glass} onChange={t.setGlass} />
      <div className="set-row">
        <span className={styles.rowLabel}>Couleur d’accent</span>
        <div className={styles.swatches}>
          {ACCENTS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Accent ${c}`}
              aria-pressed={t.accent === c}
              className={styles.swatch + (t.accent === c ? ' ' + styles.swatchOn : '')}
              style={{ background: c }}
              onClick={() => {
                t.setAccent(c)
              }}
            />
          ))}
        </div>
      </div>
      <Switch label="Accent sur la navigation" on={t.brandNav} onChange={t.setBrandNav} />
    </Drawer>
  )
}
