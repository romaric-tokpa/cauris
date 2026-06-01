/**
 * Petit client HTTP pour l'API Hono (`/api/*`, proxy Vite → :8787).
 * `credentials: 'include'` envoie le cookie de session Better Auth ; lève une
 * erreur explicite sur statut non-2xx (TanStack Query bascule alors en `error`).
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: 'include' })
  if (!res.ok) {
    throw new ApiError(res.status, `Requête ${path} échouée (HTTP ${res.status})`)
  }
  return (await res.json()) as T
}
