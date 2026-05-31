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
  /** Ton de la pastille d'icône. */
  tone?: 'pos' | 'neg' | ''
  delta?: KpiDelta
  /** Note affichée à défaut de delta. */
  note?: string
}

/** Tuile KPI — composée À L'IDENTIQUE du dashboard wireframe (kpi-label/icon/val/cur/delta).
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
  const iconBg =
    tone === 'pos' ? 'var(--pos-wash)' : tone === 'neg' ? 'var(--neg-wash)' : 'var(--panel-2)'
  const iconColor =
    tone === 'pos' ? 'var(--pos)' : tone === 'neg' ? 'var(--neg)' : 'var(--ink-soft)'
  return (
    <Card>
      <div className="r between">
        <div className="kpi-label">{label}</div>
        <div className="kpi-icon" style={{ background: iconBg, color: iconColor }}>
          <Icon name={icon} size={18} />
        </div>
      </div>
      <div className="kpi-val" style={{ fontSize: 23, marginTop: 14 }}>
        {money(value)} <span className="kpi-cur">{currency}</span>
      </div>
      {delta ? (
        <div className={'delta ' + (delta.positive ? 't-pos' : 't-neg')} style={{ marginTop: 4 }}>
          <Icon name={delta.positive ? 'up' : 'down'} size={13} /> {delta.label}
        </div>
      ) : note ? (
        <div className="t-faint" style={{ fontSize: 11.5, marginTop: 4 }}>
          {note}
        </div>
      ) : null}
    </Card>
  )
}
