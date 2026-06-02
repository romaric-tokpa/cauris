export interface SparkBarsDatum {
  /** Libellé (mois). */
  m: string
  /** Valeur de la série (ex. épargne du mois). */
  v: number
}

export interface SparkBarsProps {
  data: SparkBarsDatum[]
  height?: number
  /** Ton de la barre (variable CSS). Défaut `--pos` (épargne). */
  color?: string
}

/**
 * Barres à série SIMPLE (une barre par mois), tonifiées via un token CSS.
 * Portée À L'IDENTIQUE des barres « Épargne mensuelle » de screens-analytics-tabs.jsx
 * (réutilise les classes `wf-bars`/`wf-bargrp`/`wf-barpair`/`wf-bar`/`wf-barlbl`).
 * Hauteur normalisée au max de la série ; la géométrie inline reste DANS la primitive.
 */
export function SparkBars({ data, height = 140, color = 'var(--pos)' }: SparkBarsProps) {
  const max = Math.max(1, ...data.map((d) => d.v))
  return (
    <div className="wf-bars" style={{ height }}>
      {data.map((d, i) => (
        <div className="wf-bargrp" key={i}>
          <div className="wf-barpair">
            <span
              className="wf-bar"
              style={{ width: 18, height: `${(Math.max(0, d.v) / max) * 100}%`, background: color }}
            />
          </div>
          <span className="wf-barlbl">{d.m}</span>
        </div>
      ))}
    </div>
  )
}
