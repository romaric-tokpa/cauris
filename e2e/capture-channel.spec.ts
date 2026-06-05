import { test, expect, type Page } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * CANAL DE PAIEMENT (Lot B1) — interactions 100 % UI sur USER FRAIS (zéro baseline Aïcha) :
 *   - défaut DÉRIVÉ du compte (un chip toujours actif), recalé au changement de compte
 *     TANT QUE non surchargé, puis figé après override au clic ;
 *   - le canal choisi est STOCKÉ (vérif via GET /transactions) et se PRÉ-REMPLIT en édition ;
 *   - changement de type en édition : Dépense → Transfert masque les chips (canal N/A).
 * Comptes créés via l'API (mêmes patrons que les autres specs) ; actions = UI.
 */
test.use({ storageState: { cookies: [], origins: [] } })

interface Account {
  id: string
}

async function setup(page: Page) {
  const origin = E2E_WEB_ORIGIN
  const email = `chan-${Date.now()}@cauris.demo`
  expect(
    (
      await page.request.post('/api/auth/sign-up/email', {
        data: { email, password: 'chan-demo-2026', name: 'Canalou' },
        headers: { origin },
      })
    ).ok(),
  ).toBeTruthy()
  await page.request.post('/api/onboarding/complete', { headers: { origin } })

  const make = async (name: string, bank: string, type: string) =>
    (
      (await (
        await page.request.post('/api/accounts', {
          data: { name, bank, type, accountNumber: '00', balance: 0 },
        })
      ).json()) as { account: Account }
    ).account

  // Orange Money (mobile money) → canal par défaut orange_money ; NSIA → banque.
  const om = await make('Orange Money', 'Mobile money', 'Mobile money')
  const nsia = await make('Compte courant', 'NSIA Banque', 'Trésorerie')
  return { om, nsia }
}

test('Canal : défaut dérivé → recalage → override → stocké → round-trip → masqué en Transfert', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await setup(page)

  await page.goto('/transactions?new=1')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const channel = dialog.getByRole('group', { name: 'Canal de paiement' })
  const chip = (name: string) => channel.getByRole('button', { name, exact: true })

  // Saisie Dépense.
  await dialog.getByRole('textbox', { name: 'Libellé' }).fill('Déjeuner')
  await dialog.locator('.inp.big input').fill('3500')

  // Recalage au changement de compte (canal NON touché) : Orange Money → orange_money ; NSIA → banque.
  await dialog.getByLabel('Compte').selectOption({ label: 'Orange Money' })
  await expect(chip('Orange Money')).toHaveAttribute('aria-pressed', 'true')
  await dialog.getByLabel('Compte').selectOption({ label: 'Compte courant' })
  await expect(chip('Banque')).toHaveAttribute('aria-pressed', 'true')

  // Override manuel → Cash. Désormais figé : un changement de compte ne le recale plus.
  await chip('Cash').click()
  await expect(chip('Cash')).toHaveAttribute('aria-pressed', 'true')
  await dialog.getByLabel('Compte').selectOption({ label: 'Orange Money' })
  await expect(chip('Cash')).toHaveAttribute('aria-pressed', 'true')

  // Enregistrer → effet : drawer fermé.
  await dialog.getByRole('button', { name: /Ajouter/ }).click()
  await expect(dialog).toBeHidden()

  // Stocké : GET /transactions confirme channel = cash.
  const list = (await (await page.request.get('/api/transactions')).json()) as {
    transactions: { label: string; channel: string | null }[]
  }
  const created = list.transactions.find((t) => t.label === 'Déjeuner')
  expect(created?.channel).toBe('cash')

  // Round-trip : rouvrir en édition → le chip Cash est pré-sélectionné.
  await page.reload()
  await page.getByText('Déjeuner').first().click()
  const edit = page.getByRole('dialog')
  await expect(edit).toBeVisible()
  const editChannel = edit.getByRole('group', { name: 'Canal de paiement' })
  await expect(editChannel.getByRole('button', { name: 'Cash', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  // Changement de type Dépense → Transfert : les chips canal disparaissent (N/A).
  await edit.getByRole('button', { name: 'Transfert', exact: true }).click()
  await expect(edit.getByRole('group', { name: 'Canal de paiement' })).toHaveCount(0)
})
