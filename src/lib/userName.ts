/**
 * Dérivations du nom d'utilisateur (avatar + libellé court), partagées par le shell
 * (sidebar, headers) et les Paramètres. Source unique → l'édition du nom (updateUser)
 * se propage partout via `useSession`, sans rechargement.
 */

/** Initiale d'avatar : 1re lettre du nom, majuscule. « A » par défaut. */
export function initial(name: string | undefined): string {
  return (name?.trim()?.[0] ?? 'A').toUpperCase()
}

/** Libellé court de la sidebar : « Aïcha Koné » → « Aïcha K. » (prénom + initiale du nom). */
export function shortName(name: string | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Aïcha K.'
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1][0].toUpperCase()}.`
}
