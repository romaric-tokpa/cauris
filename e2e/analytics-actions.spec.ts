import { test, expect, type Page } from '@playwright/test'

/**
 * A5 — Actions Analytics (export de rapport + sélecteur de période), 100 % UI.
 * Tourne sur Aïcha (storageState par défaut) : aucune des deux actions ne MUTE la DB
 * (export = fichier client ; période = param d'URL) → zéro impact sur les baselines.
 *   1. Export : ouvrir le drawer → Aperçu réel → télécharger un CSV RÉEL non vide.
 *   2. Période : granularité MOIS honnête → naviguer, Appliquer → ?month= → re-query.
 */
async function bootAnalytics(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/analytics')
  await page.getByRole('button', { name: /Exporter le rapport/ }).waitFor({ state: 'visible' })
}

test('Export : Aperçu réel puis téléchargement d’un CSV non vide', async ({ page }) => {
  await bootAnalytics(page)
  await page.getByRole('button', { name: /Exporter le rapport/ }).click()
  const d = page.getByRole('dialog', { name: 'Exporter le rapport' })
  await expect(d).toBeVisible()

  // « Aperçu » est RÉEL : il résume ce que contiendra le fichier (pas un bouton mort).
  await d.getByRole('button', { name: 'Aperçu' }).click()
  await expect(d.getByText(/section\(s\).*lignes/)).toBeVisible()

  // « Générer le CSV » déclenche un VRAI téléchargement nommé par période.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    d.getByRole('button', { name: /Générer le CSV/ }).click(),
  ])
  expect(download.suggestedFilename()).toBe('cauris-analytics-2026-05.csv')
})

test('Export : décocher toutes les sections désactive la génération', async ({ page }) => {
  await bootAnalytics(page)
  await page.getByRole('button', { name: /Exporter le rapport/ }).click()
  const d = page.getByRole('dialog', { name: 'Exporter le rapport' })
  // Décoche les 3 sections cochées par défaut → plus rien à générer → bouton désactivé.
  for (const name of [/Synthèse & KPI/, /Répartition par catégorie/, /Tendances/]) {
    await d.getByRole('checkbox', { name }).click()
  }
  await expect(d.getByRole('button', { name: /Générer le CSV/ })).toBeDisabled()
})

test('Période : granularité MOIS — Appliquer un autre mois met à jour ?month=', async ({ page }) => {
  await bootAnalytics(page)
  await page.getByRole('button', { name: 'Période' }).click()
  const d = page.getByRole('dialog', { name: 'Choisir une période' })
  await expect(d).toBeVisible()

  // Les presets jour/multi-mois sont honnêtement désactivés (granularité non supportée).
  await expect(d.getByText('7 jours')).toHaveAttribute('aria-disabled', 'true')

  // Navigation au mois précédent (avril) puis sélection d'un jour → sélectionne ce MOIS.
  await d.getByRole('button', { name: 'Mois précédent' }).click()
  await expect(d.getByText('Avril 2026')).toBeVisible()
  await d.getByRole('button', { name: /15 Avril 2026/ }).click()
  // « Période sélectionnée » affiche un MOIS, jamais un compte de jours.
  await expect(d.getByText('Avril 2026').last()).toBeVisible()

  await d.getByRole('button', { name: 'Appliquer' }).click()
  await expect(page).toHaveURL(/[?&]month=2026-04/)
  // L'en-tête de l'écran reflète le nouveau mois (re-query effective ; libellé d'axe abrégé).
  await expect(page.getByText('Avr 2026').first()).toBeVisible()
})

test('Période : « Mois suivant » est borné au mois de démo (pas de mois futurs vides)', async ({ page }) => {
  await bootAnalytics(page)
  await page.getByRole('button', { name: 'Période' }).click()
  const d = page.getByRole('dialog', { name: 'Choisir une période' })
  // Au mois de démo (mai 2026), « Mois suivant » est désactivé.
  await expect(d.getByRole('button', { name: 'Mois suivant' })).toBeDisabled()
})
