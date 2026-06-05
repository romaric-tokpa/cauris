import { test, expect, type Page } from '@playwright/test'

/**
 * CHAT ROUTÉ (Lot D) — véracité : le chat ne simule jamais la compréhension.
 *  (a) « tenir jusqu'à la fin du mois ? » → bulle = VERDICT du coach (C3) + étiquette
 *      déterministe + lien « voir l'analyse complète » ;
 *  (b) question inconnue → aveu « je ne sais pas encore » + chips, JAMAIS une généralité ;
 *  (c) la vue Coach reste accessible (onglet Assistant ↔ Chat).
 * Session Aïcha. On passe par /assistant-ia d'abord pour réchauffer le cache coach-context.
 */

async function gotoChat(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/assistant-ia')
  await expect(page.getByText('Réponse en 4 couches')).toBeVisible() // vue Coach intacte + contexte chargé
  await page.getByRole('link', { name: 'Chat', exact: true }).click()
  await expect(page).toHaveURL(/\/assistant-ia\/chat$/)
}

test('Chat : question coach → bulle = verdict déterministe + lien analyse', async ({ page }) => {
  await gotoChat(page)
  const composer = page.getByRole('textbox', { name: 'Votre question' })
  await composer.fill('Est-ce que je tiens jusqu’à la fin du mois ?')
  await composer.press('Enter')

  // La bulle EST le verdict coach reformulé : étiquette d'honnêteté + lien analyse complète.
  await expect(page.getByText('Calcul déterministe · reformulé en langage clair')).toBeVisible()
  await expect(page.getByRole('link', { name: /Voir l’analyse complète/ })).toBeVisible()
})

test('Chat : question inconnue → aveu honnête + chips (jamais une généralité)', async ({ page }) => {
  await gotoChat(page)
  const composer = page.getByRole('textbox', { name: 'Votre question' })
  await composer.fill('Quel temps fait-il à Abidjan aujourd’hui ?')
  await composer.press('Enter')

  await expect(page.getByText(/je ne sais pas encore répondre/i)).toBeVisible()
  // Les questions évaluables sont proposées en chips cliquables.
  await expect(page.getByRole('button', { name: /Est-ce que je tiens/ })).toBeVisible()
})
