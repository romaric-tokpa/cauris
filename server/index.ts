import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { client } from './db/client'
import { auth } from './auth'

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

// Point de montage de la future API applicative (vide pour l'instant).
const api = new Hono()
api.get('/health', (c) => c.json({ status: 'ok' }))
app.route('/api', api)

const port = Number(process.env.PORT ?? 8787)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Hono prêt sur http://localhost:${info.port}`)
})
