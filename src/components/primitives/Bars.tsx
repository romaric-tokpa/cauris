export interface BarsDatum {
  /** Libellé (mois). */
  m: string
  /** Revenus. */
  rev: number
  /** Dépenses. */
  dep: number
}

export interface BarsProps {
  data: BarsDatum[]
  height?: number
}

/** Barres groupées revenus/dépenses (hauteur CSS en %). Portées À L'IDENTIQUE de wf-lib.jsx. */
export function Bars({ data, height = 140 }: BarsProps) {
  // `Math.max(1, …)` : série vide → -Infinity, série tout-à-zéro → 0 → hauteurs NaN/Infinity.
  // Le plancher à 1 garantit des hauteurs finies (barres à 0 % si pas de données).
  const max = Math.max(1, ...data.flatMap((d) => [d.rev, d.dep]))
  return (
    <div className="wf-bars" style={{ height }}>
      {data.map((d, i) => (
        <div className="wf-bargrp" key={i}>
          <div className="wf-barpair">
            <span className="wf-bar rev" style={{ height: `${(d.rev / max) * 100}%` }} />
            <span className="wf-bar dep" style={{ height: `${(d.dep / max) * 100}%` }} />
          </div>
          <span className="wf-barlbl">{d.m}</span>
        </div>
      ))}
    </div>
  )
}
