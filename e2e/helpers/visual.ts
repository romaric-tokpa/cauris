import { expect, type Page } from '@playwright/test'

/**
 * Helper de RÉGRESSION visuelle réutilisable — prêt pour la Phase 1.
 *
 * Modèle de fidélité en DEUX niveaux (cf. PLAN §3.3 / CLAUDE.md « Fidélité ») :
 *
 *  1. Régression (ICI) : baselines AUTO-GÉNÉRÉES, versionnées dans `e2e/baselines/`,
 *     pour thème clair ET sombre × largeurs 390 (mobile) ET 1440 (desktop). Au
 *     premier rendu validé d'un écran, Playwright écrit la baseline (et échoue ce
 *     premier run pour forcer la revue/commit) ; ensuite elle détecte les dérives.
 *
 *  2. Fidélité au wireframe (AILLEURS) : revue humaine du rendu vs le COMPOSANT
 *     SOURCE `design/wireframe/*.jsx` (source de vérité), la capture desktop de
 *     `design/wireframe/screenshots/` servant seulement de sanity visuelle.
 *     Ces PNG NE sont PAS des baselines pixel (captures canvas desktop, pas de
 *     mobile) — aucun couplage automatique vers ce dossier ici.
 *
 * SEUIL (volontairement SERRÉ — gate de régression) :
 *  - maxDiffPixelRatio 0.01 → au plus 1 % des pixels peuvent diverger ;
 *  - threshold 0.15        → faible tolérance colorimétrique par pixel.
 * Mêmes valeurs par défaut dans playwright.config.ts ; surchargeables via `options`.
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

export interface FidelityOptions {
  maxDiffPixelRatio?: number
  threshold?: number
}

/**
 * Valide (ou génère au premier passage) la baseline de RÉGRESSION d'un écran,
 * pour chaque combinaison thème × largeur. Baselines stockées dans `e2e/baselines/`
 * (projet "fidelity" de playwright.config.ts). À utiliser dans les specs
 * `*.fidelity.ts` de la Phase 1.
 *
 * Exemple (Phase 1) :
 *   await expectFidelity(page, 'dashboard', '/dashboard')
 *   // → e2e/baselines/dashboard-light-390-<platform>.png, …-dark-1440-…, etc.
 */
export async function expectFidelity(
  page: Page,
  name: string,
  url = '/',
  options: FidelityOptions = {},
): Promise<void> {
  const opts = { ...VISUAL_THRESHOLD, ...options }
  for (const theme of THEMES) {
    for (const width of [WIDTHS.mobile, WIDTHS.desktop]) {
      await setWidth(page, width)
      await page.goto(url)
      await applyTheme(page, theme)
      await expect(page).toHaveScreenshot(`${name}-${theme}-${width}.png`, opts)
    }
  }
}
