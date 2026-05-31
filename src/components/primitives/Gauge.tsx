export type Tone = '' | 'ok' | 'warn' | 'over'

export interface GaugeProps {
  pct: number
  tone?: Tone
  size?: number
  stroke?: number
}

/** Jauge demi-cercle SVG, couleur selon le ton. Portée À L'IDENTIQUE de wf-lib.jsx. */
export function Gauge({ pct, tone = '', size = 152, stroke = 13 }: GaugeProps) {
  const r = (size - stroke) / 2
  const cy = size / 2
  const circ = Math.PI * r
  const shown = Math.max(0, Math.min(pct, 100))
  const col =
    tone === 'over'
      ? 'var(--neg)'
      : tone === 'warn'
        ? 'var(--warn)'
        : tone === 'ok'
          ? 'var(--pos)'
          : 'var(--accent)'
  const h = cy + stroke / 2 + 2
  const d = `M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`
  return (
    <div style={{ position: 'relative', width: size, height: h }}>
      <svg width={size} height={h} viewBox={`0 0 ${size} ${h}`} style={{ display: 'block' }}>
        <path
          d={d}
          fill="none"
          stroke="var(--panel-2)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={d}
          fill="none"
          stroke={col}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - shown / 100)}
        />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: cy - 32, textAlign: 'center' }}>
        <div
          className="t-mono"
          style={{ fontSize: 26, fontWeight: 600, color: col, lineHeight: 1 }}
        >
          {pct}%
        </div>
        <div className="t-faint" style={{ fontSize: 10.5, fontWeight: 600, marginTop: 3 }}>
          consommé
        </div>
      </div>
    </div>
  )
}
