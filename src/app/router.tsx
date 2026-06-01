import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { AppShell } from '../components/shell'
import { NAV_ALL } from '../components/shell/nav'
import { ModulePage } from '../screens/ModulePage'
import { AuthLayout } from '../screens/auth/AuthLayout'
import { Login } from '../screens/auth/Login'
import { Signup } from '../screens/auth/Signup'
import { ForgotPassword } from '../screens/auth/ForgotPassword'
import { ResetPassword } from '../screens/auth/ResetPassword'
import { OnboardingWizard } from '../screens/onboarding/OnboardingWizard'
import { RequireAuth, RequireGuest, RequireOnboarding } from './guards'

// Modules en routes enfants de l'AppShell, dérivés de NAV (libellés 1:1 du wireframe).
const moduleRoutes: RouteObject[] = NAV_ALL.map((n) =>
  n.end
    ? { index: true, element: <ModulePage title={n.label} /> }
    : { path: n.path.slice(1), element: <ModulePage title={n.label} /> },
)

export const router = createBrowserRouter([
  // App (shell) — sous garde : authentifié + onboardé.
  {
    path: '/',
    element: <RequireAuth />,
    children: [{ element: <AppShell />, children: moduleRoutes }],
  },
  // Auth (plein écran) — sous garde invité.
  {
    path: '/auth',
    element: <RequireGuest />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { index: true, element: <Login /> },
          { path: 'inscription', element: <Signup /> },
          { path: 'mot-de-passe-oublie', element: <ForgotPassword /> },
          { path: 'reinitialisation', element: <ResetPassword /> },
        ],
      },
    ],
  },
  // Onboarding (plein écran) — sous garde : authentifié, pas encore onboardé.
  {
    path: '/onboarding',
    element: <RequireOnboarding />,
    children: [{ index: true, element: <OnboardingWizard /> }],
  },
])
