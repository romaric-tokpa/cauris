import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

/**
 * Config drizzle-kit (génération + migrations).
 * Dialecte Turso/SQLite. Schéma vide pour l'instant (rempli en Phase 3).
 * Dev sans config : retombe sur le fichier SQLite local `file:local.db`.
 */
export default defineConfig({
  dialect: 'turso',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
})
