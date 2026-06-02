export interface ProjectionBarsProps {
  /** Libellés de l'axe (« Auj. », « +7 j », …). */
  labels: string[]
  /** Soldes projetés alignés sur `labels`. */
  values: number[]
  /** Nombre de points « réalisés » en tête de série (rendus pleins). Défaut 1 (Auj.). */
  realizedCount?: number
  height?: number
}

/**
 * Barres « Solde projeté » (une barre par horizon) — portées À L'IDENTIQUE du graphe
 * de PrevisionsDesk (screens-ai.jsx) : les premiers `realizedCount` points sont
 * « réalisés » (plein `--ink`), les suivants « prévision » (`--accent`, opacité .5).
 * Réutilise les classes `wf-bars`/`wf-bargrp`/`wf-barpair`/`wf-bar`/`wf-barlbl` ; la
 * géométrie inline (hauteur normalisée au max) reste DANS la primitive (comme `Bars`).
 */
export function ProjectionBars({
  labels,
  values,
  realizedCount = 1,
  height = 170,
}: ProjectionBarsProps) {
  const max = Math.max(1, ...values)
  return (
    <div className="wf-bars" style={{ height }}>
      {values.map((v, i) => {
        const realized = i < realizedCount
        return (
          <div className="wf-bargrp" key={i}>
            <div className="wf-barpair">
              <span
                className="wf-bar"
                style={{
                  width: 26,
                  height: `${(Math.max(0, v) / max) * 100}%`,
                  background: realized ? 'var(--ink)' : 'var(--accent)',
                  opacity: realized ? 1 : 0.5,
                }}
              />
            </div>
            <span className="wf-barlbl">{labels[i]}</span>
          </div>
        )
      })}
    </div>
  )
}
