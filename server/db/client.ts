import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

/**
 * Client base de données (libSQL / Turso) + instance Drizzle.
 *
 * - **Dev** : si `TURSO_DATABASE_URL` est absent, on retombe sur un fichier
 *   SQLite local (`file:local.db`) — aucune config requise pour démarrer.
 * - **Prod** : `TURSO_DATABASE_URL` (+ `TURSO_AUTH_TOKEN`) pointent vers Turso.
 */
const url = process.env.TURSO_DATABASE_URL ?? 'file:local.db'
const authToken = process.env.TURSO_AUTH_TOKEN

export const client = createClient({ url, authToken })

// `schema` est vide pour l'instant (cf. server/db/schema.ts) — rempli en Phase 3.
export const db = drizzle(client, { schema })
