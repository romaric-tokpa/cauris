import { auth } from './auth'

/**
 * Helper session → user_id, réutilisable par toutes les routes API.
 *
 * Extrait l'utilisateur authentifié depuis la session Better Auth. Renvoie son
 * `id` ou `null` (l'appelant répond 401). C'est l'unique source du `userId`
 * passé à la couche d'accès (`server/db/queries.ts`), qui scope chaque requête.
 */
export async function getSessionUserId(headers: Headers): Promise<string | null> {
  const session = await auth.api.getSession({ headers })
  return session?.user.id ?? null
}
