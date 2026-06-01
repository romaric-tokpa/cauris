import { mkdirSync } from 'node:fs'
import { test as setup, expect } from '@playwright/test'
import { AUTH_FILE } from './constants'

/**
 * Crée (ou réutilise) une session de test authentifiée + onboardée, et sauvegarde
 * les cookies dans un storageState réutilisé par les projets `smoke` et `fidelity`.
 * Les gardes redirigent `/` → `/auth` sans session : ce setup permet aux tests du
 * shell de rendre l'app authentifiée.
 */
const EMAIL = 'e2e@cauris.test'
const PASSWORD = 'e2e-password-123'
const ORIGIN = 'http://localhost:5173'

setup('authenticate', async ({ request }) => {
  // Sign-up, ou sign-in si l'utilisateur de test existe déjà (db locale persistante).
  const signUp = await request.post('/api/auth/sign-up/email', {
    data: { name: 'E2E User', email: EMAIL, password: PASSWORD },
    headers: { origin: ORIGIN },
  })
  if (!signUp.ok()) {
    const signIn = await request.post('/api/auth/sign-in/email', {
      data: { email: EMAIL, password: PASSWORD },
      headers: { origin: ORIGIN },
    })
    expect(signIn.ok()).toBeTruthy()
  }

  // Marque l'onboarding terminé (idempotent) → la garde laisse passer vers le shell.
  const complete = await request.post('/api/onboarding/complete', { headers: { origin: ORIGIN } })
  expect(complete.ok()).toBeTruthy()

  mkdirSync('e2e/.auth', { recursive: true })
  await request.storageState({ path: AUTH_FILE })
})
