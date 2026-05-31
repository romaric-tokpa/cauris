import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { AppShell } from '../components/shell'
import { NAV_ALL } from '../components/shell/nav'
import { ModulePage } from '../screens/ModulePage'
import { FullScreenPlaceholder } from '../screens/FullScreenPlaceholder'
import { AuthLayout } from '../screens/auth/AuthLayout'
import { Login } from '../screens/auth/Login'
import { Signup } from '../screens/auth/Signup'
import { ForgotPassword } from '../screens/auth/ForgotPassword'
import { ResetPassword } from '../screens/auth/ResetPassword'

// Modules en routes enfants de l'AppShell, dérivés de NAV (libellés 1:1 du wireframe).
const moduleRoutes: RouteObject[] = NAV_ALL.map((n) =>
  n.end
    ? { index: true, element: <ModulePage title={n.label} /> }
    : { path: n.path.slice(1), element: <ModulePage title={n.label} /> },
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: moduleRoutes,
  },
  // HORS shell (plein écran). Gardes de route = sous-bloc D.
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Login /> },
      { path: 'inscription', element: <Signup /> },
      { path: 'mot-de-passe-oublie', element: <ForgotPassword /> },
      { path: 'reinitialisation', element: <ResetPassword /> },
    ],
  },
  {
    path: '/onboarding',
    element: (
      <FullScreenPlaceholder
        title="Onboarding"
        text="Le parcours de première prise en main (5 étapes) arrive en Phase 2."
      />
    ),
  },
])
