/**
 * Schéma Drizzle.
 *
 * Phase 2 : tables d'**authentification** (Better Auth) générées via la CLE
 * (`server/db/auth-schema.ts`), re-exportées ici pour que `db` les connaisse.
 *
 * Le schéma **métier** (accounts, transactions, budgets, …) + le seed des données
 * d'Aïcha arrivent en **Phase 3**. Aucune table métier ici.
 */
export * from './auth-schema'
