import 'dotenv/config'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db/client'
import * as authSchema from './db/auth-schema'

const isProd = process.env.NODE_ENV === 'production'

/**
 * Better Auth — email + mot de passe, adapter Drizzle (provider sqlite), monté sur
 * Hono (cf. server/index.ts). Tables d'auth générées via la CLI Better Auth.
 *
 * `onboardingComplete` : attribut user (default false), non settable par le client
 * (`input: false`) — flippé côté serveur via POST /api/onboarding/complete.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema: authSchema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: ['http://localhost:5173'],
  emailAndPassword: {
    enabled: true,
    sendResetPassword: ({ user, url }) => {
      // Stub dev : on logue le lien de réinitialisation (cliquable → /auth/reinitialisation).
      // TODO: brancher un vrai provider email (Resend/SMTP). NE JAMAIS logguer le lien en prod.
      if (!isProd) console.log(`[reset] ${user.email} -> ${url}`)
      return Promise.resolve()
    },
  },
  user: {
    additionalFields: {
      onboardingComplete: { type: 'boolean', defaultValue: false, input: false },
    },
  },
})
