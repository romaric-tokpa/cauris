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

/** Mutation (POST/PATCH/DELETE). Remonte le message d'erreur serveur si présent. */
export async function apiMutate<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let message = `Requête ${path} échouée (HTTP ${res.status})`
    try {
      const j = (await res.json()) as { error?: string }
      if (j.error) message = j.error
    } catch {
      /* corps non-JSON — on garde le message générique */
    }
    throw new ApiError(res.status, message)
  }
  return (await res.json()) as T
}
