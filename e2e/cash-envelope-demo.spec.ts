import { test, expect } from '@playwright/test'

/**
 * DÉMO Aïcha (Lot B4) — la carte Espèces seedée (5ᵉ compte) + son enveloppe sont RÉELLES :
 * Comptes affiche « Espèces » avec l'entrée « Mode enveloppe › » → l'écran enveloppe
 * montre l'état wireframe (38 000 restants · dépensé 62 000 · plafond 100 000).
 * Session Aïcha (storageState par défaut) — aucun override.
 */

test('Comptes Aïcha : carte Espèces → Mode enveloppe → état wireframe (38 000 / 62 000 / 100 000)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/comptes')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })

  // La 5ᵉ carte Espèces existe, avec l'entrée dédiée « Mode enveloppe » (≠ « Voir les opérations »).
  const envLink = page.getByRole('link', { name: /Mode enveloppe/ })
  await expect(envLink).toBeVisible()
  await envLink.click()

  // Écran enveloppe : reste 38 000, dépensé 62 000, plafond 100 000 (chiffres wireframe).
  await expect(page.getByText(/restants/)).toBeVisible()
  await expect(page.getByText(/38.000/)).toBeVisible()
  await expect(page.getByText(/Dépensé/)).toBeVisible()
  await expect(page.getByText(/62.000/)).toBeVisible()
  await expect(page.getByText(/100.000/)).toBeVisible()
})
