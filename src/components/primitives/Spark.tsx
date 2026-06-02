export interface SparkProps {
  pts: number[]
  w?: number
  h?: number
  stroke?: string
}

/** Sparkline (path + remplissage --accent-wash). Portée À L'IDENTIQUE de wf-lib.jsx.
 *  Garde-fou : une série vide / à un seul point / non finie ne peut pas produire un `d`
 *  SVG valide (1er point `M` manquant, ou `step = w/0 = Infinity` → NaN). Dans ce cas on
 *  rend un SVG VIDE de mêmes dimensions (layout préservé) plutôt qu'un `d` malformé qui
 *  ferait planter le rendu React du sous-arbre. */
export function Spark({ pts, w = 160, h = 44, stroke = 'var(--accent)' }: SparkProps) {
  const valid = Array.isArray(pts) ? pts.filter((p) => Number.isFinite(p)) : []
  if (valid.length < 2) {
    return (
      <svg
        className="wf-spark"
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      />
    )
  }
  const max = Math.max(...valid)
  const min = Math.min(...valid)
  const span = max - min || 1
  const step = w / (valid.length - 1)
  const d = valid
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
