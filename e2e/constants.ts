/** Chemin du storageState de session de test (partagé config ↔ setup). */
export const AUTH_FILE = 'e2e/.auth/user.json'

/**
 * Harnais e2e ISOLÉ du dev — ports + DB dédiés (jamais 5173/8787 ni `local.db`).
 *
 * Pourquoi : le projet `fidelity` compare des pixels. Si Playwright réutilisait un
 * `npm run dev` manuel (module périmé par HMR) ou seedait la DB de dev (`local.db`),
 * les baselines dériveraient sans rapport avec le code. On part donc d'un serveur
 * DÉDIÉ + une DB JETABLE re-seedée à neuf à chaque `npm run e2e` (cf. playwright.config.ts).
 *
 * Conséquence : `npm run e2e` est reproductible MÊME si un `npm run dev` tourne en
 * parallèle (ports disjoints, fichiers DB disjoints).
 */
export const E2E_WEB_PORT = 5273
export const E2E_SERVER_PORT = 8887
export const E2E_WEB_ORIGIN = `http://localhost:${E2E_WEB_PORT}`
export const E2E_SERVER_ORIGIN = `http://localhost:${E2E_SERVER_PORT}`

/** DB SQLite JETABLE des tests (gitignored, re-créée à chaque run). Jamais `local.db`. */
export const E2E_DB_URL = 'file:e2e-local.db'
