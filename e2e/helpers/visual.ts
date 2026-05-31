import { expect, type Page } from '@playwright/test'

/**
 * Helper de régression visuelle réutilisable — prêt pour la Phase 1.
 *
 * Références de fidélité : les 8 captures de `design/wireframe/screenshots/`,
 * montées via le projet "fidelity" de `playwright.config.ts`
 * (snapshotPathTemplate → design/wireframe/screenshots/{arg}{ext}).
 *
 * Principe : comparer le rendu d'un écran à SA capture de référence, en thème
 * clair ET sombre, aux largeurs 390 (mobile) et 1440 (desktop).
 *
 * SEUIL (volontairement SERRÉ — gate de fidélité pixel) :
 *  - maxDiffPixelRatio 0.01 → au plus 1 % des pixels peuvent diverger ;
 *  - threshold 0.15        → faible tolérance colorimétrique par pixel.
 * Les mêmes valeurs sont posées par défaut dans playwright.config.ts ; elles
 * restent surchargeables au cas par cas via `options`.
 */
export const VISUAL_THRESHOLD = {
  maxDiffPixelRatio: 0.01,
  threshold: 0.15,
} as const

export const THEMES = ['light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

// Largeurs de référence imposées (mobile-first 390 ↔ desktop 1440).
export const WIDTHS = { mobile: 390, desktop: 1440 } as const

/** Applique un thème (data-theme) et attend que les polices soient chargées. */
export async function applyTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t)
  }, theme)
  await page.evaluate(async () => {
    await document.fonts.ready
  })
}

/** Pose une largeur de viewport (hauteur généreuse pour capturer toute la page). */
export async function setWidth(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 1200 })
}

/**
 * Une variante de fidélité = un thème + une largeur + le fichier de référence
 * correspondant dans `design/wireframe/screenshots/` (ex. `full.png`).
 */
export interface FidelityVariant {
  theme: Theme
  width: number
  reference: string
}

/**
 * Compare l'écran rendu à `url` à ses captures de référence, pour chaque
 * variante (thème × largeur). À utiliser dans les specs `*.fidelity.ts` de la
 * Phase 1 — exécutées sous le projet "fidelity".
 *
 * Exemple (Phase 1) :
 *   await expectFidelity(page, '/', [
 *     { theme: 'light', width: WIDTHS.desktop, reference: 'full.png' },
 *     { theme: 'dark',  width: WIDTHS.desktop, reference: 'dark.png' },
 *   ])
 */
export async function expectFidelity(
  page: Page,
  url: string,
  variants: FidelityVariant[],
  options: { maxDiffPixelRatio?: number; threshold?: number } = {},
): Promise<void> {
  const opts = { ...VISUAL_THRESHOLD, ...options }
  for (const variant of variants) {
    await setWidth(page, variant.width)
    await page.goto(url)
    await applyTheme(page, variant.theme)
    await expect(page).toHaveScreenshot(variant.reference, opts)
  }
}
