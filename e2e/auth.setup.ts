import { mkdirSync } from 'node:fs'
import { test as setup, expect } from '@playwright/test'
import { AUTH_FILE, E2E_WEB_ORIGIN } from './constants'

/**
 * Session de test authentifiée = l'utilisatrice démo **Aïcha** (`aicha@cauris.demo`),
 * créée + onboardée + seedée par `db:seed` (lancé par le webServer, cf.
 * playwright.config.ts). Sa session sert de contexte aux projets `smoke` et
 * `fidelity` : le dashboard rend ainsi les chiffres fixtures du wireframe.
 */
const EMAIL = 'aicha@cauris.demo'
const PASSWORD = 'aicha-demo-2026'
// Origine du front e2e (port dédié) — doit figurer dans `trustedOrigins` côté
// Better Auth (cf. AUTH_TRUSTED_ORIGINS dans playwright.config.ts).
const ORIGIN = E2E_WEB_ORIGIN

setup('authenticate', async ({ request }) => {
  const signIn = await request.post('/api/auth/sign-in/email', {
    data: { email: EMAIL, password: PASSWORD },
    headers: { origin: ORIGIN },
  })
  expect(signIn.ok()).toBeTruthy()

  mkdirSync('e2e/.auth', { recursive: true })
  await request.storageState({ path: AUTH_FILE })
})
