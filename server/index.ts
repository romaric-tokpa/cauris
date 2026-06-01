import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { client, db } from './db/client'
import { user } from './db/auth-schema'
import { auth } from './auth'
import { getSessionUserId } from './session'
import { getMonthlySummary } from './db/queries'

// Mois de démonstration (période de réf. produit : Mai 2026 ; le seed s'y arrête).
const DEMO_MONTH = '2026-05'

/**
 * Backend Cauris (Hono).
 * - `/api/auth/*` : Better Auth (email + mot de passe).
 * - `/health`, `/health/db` : points de santé.
 * L'API métier se montera sous `/api` (Phase 3).
 */
const app = new Hono()

// Better Auth : délègue toutes les routes /api/auth/* au handler (Request/Response web).
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))

// Health check infra — accessible en direct (et via le proxy Vite /api/health).
app.get('/health', (c) => c.json({ status: 'ok' }))

// Health check base de données : prouve la connexion via un SELECT 1.
app.get('/health/db', async (c) => {
  try {
    await client.execute('select 1')
    return c.json({ status: 'ok', db: 'up' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ status: 'error', db: 'down', message }, 503)
  }
})

// API applicative.
const api = new Hono()
api.get('/health', (c) => c.json({ status: 'ok' }))

// Marque l'onboarding terminé pour l'utilisateur de la SESSION (seul chemin pour
// flipper onboarding_complete, cohérent avec input:false côté Better Auth).
api.post('/onboarding/complete', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  await db.update(user).set({ onboardingComplete: true }).where(eq(user.id, userId))
  return c.json({ status: 'ok' })
})

// Démo bout-en-bout du scoping : renvoie les agrégats du mois pour le user de
// session (via la façade). Prouve session → user_id → requête scopée. ?month=YYYY-MM.
api.get('/dashboard/summary', async (c) => {
  const userId = await getSessionUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)
  const month = c.req.query('month') ?? DEMO_MONTH
  const summary = await getMonthlySummary(userId, month)
  return c.json({ month, summary })
})

app.route('/api', api)

const port = Number(process.env.PORT ?? 8787)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Hono prêt sur http://localhost:${info.port}`)
})
