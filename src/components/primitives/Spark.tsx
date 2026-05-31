export interface SparkProps {
  pts: number[]
  w?: number
  h?: number
  stroke?: string
}

/** Sparkline (path + remplissage --accent-wash). Portée À L'IDENTIQUE de wf-lib.jsx. */
export function Spark({ pts, w = 160, h = 44, stroke = 'var(--accent)' }: SparkProps) {
  const max = Math.max(...pts)
  const min = Math.min(...pts)
  const span = max - min || 1
  const step = w / (pts.length - 1)
  const d = pts
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - ((p - min) / span) * (h - 6) - 3).toFixed(1)}`,
    )
    .join(' ')
  return (
    <svg
      className="wf-spark"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
    >
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="var(--accent-wash)" stroke="none" />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
