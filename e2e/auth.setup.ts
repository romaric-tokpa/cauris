import { mkdirSync } from 'node:fs'
import { test as setup, expect } from '@playwright/test'
import { AUTH_FILE } from './constants'

/**
 * Session de test authentifiée = l'utilisatrice démo **Aïcha** (`aicha@cauris.demo`),
 * créée + onboardée + seedée par `db:seed` (lancé par le webServer, cf.
 * playwright.config.ts). Sa session sert de contexte aux projets `smoke` et
 * `fidelity` : le dashboard rend ainsi les chiffres fixtures du wireframe.
 */
const EMAIL = 'aicha@cauris.demo'
const PASSWORD = 'aicha-demo-2026'
const ORIGIN = 'http://localhost:5173'

setup('authenticate', async ({ request }) => {
  const signIn = await request.post('/api/auth/sign-in/email', {
    data: { email: EMAIL, password: PASSWORD },
    headers: { origin: ORIGIN },
  })
  expect(signIn.ok()).toBeTruthy()

  mkdirSync('e2e/.auth', { recursive: true })
  await request.storageState({ path: AUTH_FILE })
})
