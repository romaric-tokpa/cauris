import { createAuthClient } from 'better-auth/react'

/**
 * Client Better Auth (front). `baseURL` omis → origine courante du navigateur ;
 * en dev le proxy Vite renvoie `/api/auth/*` vers Hono (:8787).
 */
export const authClient = createAuthClient()

// `requestPasswordReset` = nom courant de l'ancien `forgetPassword` (mieux typé).
export const { signIn, signUp, signOut, useSession, requestPasswordReset, resetPassword } =
  authClient
