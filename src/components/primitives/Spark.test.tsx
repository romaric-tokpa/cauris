import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { Spark } from './Spark'

/**
 * Garde-fou SVG : une série vide / à un point / non finie NE DOIT JAMAIS produire un
 * attribut `d` malformé (1er point `M` manquant → « Expected moveto command ») qui
 * faisait planter le rendu React du sous-arbre (écran Comptes mobile, viewBox 320×40).
 */
afterEach(cleanup)

function paths(container: HTMLElement): SVGPathElement[] {
  return Array.from(container.querySelectorAll('path'))
}

describe('Spark — garde-fou série dégénérée', () => {
  it('série vide → aucun <path> (SVG vide, pas de `d` malformé)', () => {
    const { container } = render(<Spark pts={[]} w={320} h={40} />)
    expect(container.querySelector('svg')).not.toBeNull() // dimensions préservées
    expect(paths(container)).toHaveLength(0)
  })

  it('série à 1 point → aucun <path> (évite step = w/0 = Infinity → NaN)', () => {
    const { container } = render(<Spark pts={[42]} w={320} h={40} />)
    expect(paths(container)).toHaveLength(0)
  })

  it('valeurs non finies (NaN/Infinity) filtrées → pas de NaN dans `d`', () => {
    const { container } = render(<Spark pts={[NaN, Infinity]} w={320} h={40} />)
    expect(paths(container)).toHaveLength(0)
    expect(container.innerHTML).not.toContain('NaN')
  })

  it('série valide → `d` commence par M, aucun NaN', () => {
    const { container } = render(<Spark pts={[10, 20, 15, 30, 25, 40]} w={320} h={40} />)
    const ps = paths(container)
    expect(ps.length).toBeGreaterThan(0)
    for (const p of ps) {
      const d = p.getAttribute('d') ?? ''
      expect(d.startsWith('M')).toBe(true)
      expect(d).not.toContain('NaN')
    }
  })
})
