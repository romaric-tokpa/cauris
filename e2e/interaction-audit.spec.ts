import { test, expect, type Page } from '@playwright/test'

/**
 * GARDE D'INTERACTION (anti boutons morts) — au-delà du rendu, on vérifie que les
 * boutons d'action PRINCIPAUX de chaque écran AGISSENT, ou sont HONNÊTEMENT désactivés.
 * Complète post-nav-interaction.spec.ts (Dashboard / Transactions / FAB / Paramètres).
 *
 * Règle auditée : un élément interactif est soit (a) câblé et fonctionnel, soit
 * (b) `disabled` honnête — jamais (c) cliquable sans effet (mort silencieux).
 */

async function bootDesktop(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
}

// ───────────────────────────── Shell ─────────────────────────────

test('Shell : la cloche du header navigue vers /notifications', async ({ page }) => {
  await bootDesktop(page)
  await page.getByRole('button', { name: /Notifications/ }).first().click()
  await expect(page).toHaveURL(/\/notifications/)
})

test('Shell : segment période — « Mois » actif, portées non livrées désactivées', async ({ page }) => {
  await bootDesktop(page)
  const seg = page.getByRole('group', { name: 'Période' })
  await expect(seg.getByRole('button', { name: 'Jour' })).toBeDisabled()
  await expect(seg.getByRole('button', { name: 'Semaine' })).toBeDisabled()
  await expect(seg.getByRole('button', { name: 'Année' })).toBeDisabled()
  await expect(seg.getByRole('button', { name: 'Mois' })).toBeEnabled()
})

// ──────────────── Actions principales par écran ────────────────

test('Budgets : « Créer un budget » honnêtement désactivé', async ({ page }) => {
  await bootDesktop(page)
  await page.getByRole('link', { name: 'Budgets' }).click()
  await expect(page.getByRole('button', { name: /Créer un budget/ })).toBeDisabled()
})

test('Objectifs : « Créer un objectif » honnêtement désactivé', async ({ page }) => {
  await bootDesktop(page)
  await page.getByRole('link', { name: 'Objectifs' }).click()
  await expect(page.getByRole('button', { name: /Créer un objectif/ })).toBeDisabled()
})

test('Comptes : « Ajouter un compte » honnêtement désactivé', async ({ page }) => {
  await bootDesktop(page)
  await page.getByRole('link', { name: 'Comptes' }).click()
  await expect(page.getByRole('button', { name: /Ajouter un compte/ })).toBeDisabled()
})

test('Analytics : « Exporter le rapport » et « Période » honnêtement désactivés', async ({ page }) => {
  await bootDesktop(page)
  await page.getByRole('link', { name: 'Analytics' }).click()
  await expect(page.getByRole('button', { name: /Exporter le rapport/ })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Période' })).toBeDisabled()
})

test('Notifications : « Tout marquer comme lu » offert + filtre interactif', async ({ page }) => {
  await bootDesktop(page)
  await page.getByRole('link', { name: 'Notifications' }).click()
  // « Tout marquer comme lu » est OFFERT (actif), pas un faux bouton désactivé.
  // NB : on ne le CLIQUE pas — c'est une vraie mutation qui polluerait la DB de
  // test partagée (les baselines de fidélité attendent des non-lues).
  await expect(page.getByRole('button', { name: /Tout marquer comme lu/ })).toBeEnabled()
  // Un filtre AGIT (effet visible, non destructif) : l'onglet devient actif.
  const tab = page.getByRole('button', { name: 'Non lues', exact: true })
  await tab.click()
  await expect(tab).toHaveAttribute('aria-pressed', 'true')
})

test('Prêt : « Simuler » ouvre le simulateur', async ({ page }) => {
  await bootDesktop(page)
  await page.getByRole('link', { name: 'Prêt / Dette', exact: true }).click()
  await page.getByRole('button', { name: /Simuler/ }).first().click()
  // Desktop + mobile coexistent dans le DOM (CSS masque l'inactif) → cibler le visible.
  await expect(page.locator('.card-title:visible', { hasText: 'Paramètres du scénario' })).toBeVisible()
})

test('Assistant : le composer envoie la question (bulle utilisateur)', async ({ page }) => {
  await bootDesktop(page)
  await page.getByRole('link', { name: 'Assistant', exact: true }).click()
  const composer = page.getByRole('textbox', { name: 'Votre question' })
  await composer.fill('Combien ai-je dépensé ce mois-ci ?')
  await composer.press('Enter')
  await expect(
    page.locator('.msg.u .bubble:visible', { hasText: 'Combien ai-je dépensé ce mois-ci ?' }),
  ).toBeVisible()
})
