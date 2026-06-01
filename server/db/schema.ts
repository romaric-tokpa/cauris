/**
 * Schéma Drizzle.
 *
 * Phase 2 : tables d'**authentification** (Better Auth) générées via la CLI
 * (`server/db/auth-schema.ts`).
 * Phase 3 : tables **métier** (`business-schema.ts`) portées de `wf-lib.jsx`.
 *
 * Tout est re-exporté ici pour que `db` (et drizzle-kit) connaissent l'ensemble.
 */
export * from './auth-schema'
export * from './business-schema'
