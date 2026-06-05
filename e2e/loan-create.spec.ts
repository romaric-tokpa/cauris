import { test, expect, type Page } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * CRÉER LE VRAI PRÊT SGCI via le FORMULAIRE → l'échéancier affiché matche le PDF (Lot prêt).
 * User frais (cold start réparé) : « Aucun prêt » + « Ajouter un prêt » → form → l'échéancier
 * (calculé client, validé serveur, persisté) montre les lignes du tableau d'amortissement réel.
 */
test.use({ storageState: { cookies: [], origins: [] } })

async function freshUser(page: Page) {
  const origin = E2E_WEB_ORIGIN
  const email = `loancreate-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@cauris.demo`
  expect(
    (await page.request.post('/api/auth/sign-up/email', { data: { email, password: 'loan-2026', name: 'Emprunteur' }, headers: { origin } })).ok(), // prettier-ignore
  ).toBeTruthy()
  await page.request.post('/api/onboarding/complete', { headers: { origin } })
}

test('Cold start → Ajouter le prêt SGCI → échéancier = PDF (59 116 / reste 4 440 884)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await freshUser(page)

  await page.goto('/pret')
  // Cold start réparé : état vide actionnable.
  await expect(page.getByText('Aucun prêt en cours')).toBeVisible()
  await page.getByRole('button', { name: /Ajouter un prêt/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  // Saisie du prêt SGCI réel.
  await dialog.getByLabel('Nom du prêt').fill('Prêt SGCI')
  await dialog.getByLabel('Type').fill('Auto')
  await dialog.getByLabel('Montant emprunté').fill('4500000')
  await dialog.getByLabel('Mensualité (tout-compris)').fill('94179')
  await dialog.getByLabel('Taux nominal (%/an)').fill('7.5')
  await dialog.getByLabel('Durée (échéances)').fill('60')
  await dialog.getByLabel('Date de 1ʳᵉ échéance').fill('2025-02-25')
  await dialog.getByLabel('Taxe sur intérêts (%)').fill('10')
  await dialog.getByLabel('Assurance (%/an)').fill('1.1')
  await dialog.getByLabel('Frais de dossier').fill('108900')
  await dialog.getByLabel('Jours 1ʳᵉ période').fill('29')

  await dialog.getByRole('button', { name: /Ajouter le prêt/ }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Prêt SGCI')

  // L'échéancier AFFICHÉ matche le PDF (ligne 002 : amort 59 116 → reste 4 440 884).
  await page.goto('/pret?tab=Amortissement')
  await expect(page.getByText(/59.116/).first()).toBeVisible()
  await expect(page.getByText(/4.440.884/).first()).toBeVisible()

  // Preuve persistée : la dernière échéance solde le capital à 0.
  const loans = (await (await page.request.get('/api/loans')).json()) as { loans: { id: string }[] }
  const detail = (await (await page.request.get(`/api/loans/${loans.loans[0].id}`)).json()) as {
    amortization: { principalPart: number; remainingAfter: number }[]
  }
  const reg = detail.amortization.filter((a) => a.remainingAfter >= 0)
  expect(reg[reg.length - 1].remainingAfter).toBe(0)
  expect(detail.amortization.some((a) => a.principalPart === 59116)).toBe(true)
})
