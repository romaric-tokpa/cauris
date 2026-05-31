import { Icon, type IconName } from '../primitives'
import { money } from '../../lib/money'
import { Card } from './Card'

export interface KpiDelta {
  /** Texte du delta (ex. « +3,2 % vs avril »). */
  label: string
  positive: boolean
}

export interface KpiTileProps {
  label: string
  value: number
  icon: IconName
  /** Suffixe rendu à part, en mono (défaut « FCFA »). */
  currency?: string
  /** Ton de la pastille d'icône (classe `.kpi-icon.pos`/`.neg`, sinon neutre). */
  tone?: 'pos' | 'neg' | ''
  delta?: KpiDelta
  /** Note affichée à défaut de delta. */
  note?: string
}

/** Tuile KPI — composée À L'IDENTIQUE du dashboard wireframe (kpi-label/icon/val/cur/delta).
 *  Tailles, marges et ton de la pastille pilotés par classes (components.css `.kpi-tile`).
 *  Montant via `money()` en mono, suffixe `FCFA` à part. */
export function KpiTile({
  label,
  value,
  icon,
  currency = 'FCFA',
  tone = '',
  delta,
  note,
}: KpiTileProps) {
  return (
    <Card className="kpi-tile">
      <div className="r between">
        <div className="kpi-label">{label}</div>
        <div className={`kpi-icon${tone ? ' ' + tone : ''}`}>
          <Icon name={icon} size={18} />
        </div>
      </div>
      <div className="kpi-val">
        {money(value)} <span className="kpi-cur">{currency}</span>
      </div>
      {delta ? (
        <div className={'delta ' + (delta.positive ? 't-pos' : 't-neg')}>
          <Icon name={delta.positive ? 'up' : 'down'} size={13} /> {delta.label}
        </div>
      ) : note ? (
        <div className="t-faint kpi-note">{note}</div>
      ) : null}
    </Card>
  )
}
