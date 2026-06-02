import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { AppShell } from '../components/shell'
import { NAV_ALL } from '../components/shell/nav'
import { ModulePage } from '../screens/ModulePage'
import { Dashboard } from '../screens/dashboard'
import { Transactions } from '../screens/transactions'
import { Budgets, BudgetDetail } from '../screens/budgets'
import { Objectifs, ObjectifDetail } from '../screens/objectifs'
import { Comptes, ComptesDetail } from '../screens/comptes'
import { Pret } from '../screens/pret'
import { Analytics } from '../screens/analytics'
import { AuthLayout } from '../screens/auth/AuthLayout'
import { Login } from '../screens/auth/Login'
import { Signup } from '../screens/auth/Signup'
import { ForgotPassword } from '../screens/auth/ForgotPassword'
import { ResetPassword } from '../screens/auth/ResetPassword'
import { OnboardingWizard } from '../screens/onboarding/OnboardingWizard'
import { RequireAuth, RequireGuest, RequireOnboarding } from './guards'

// Modules en routes enfants de l'AppShell, dérivés de NAV (libellés 1:1 du wireframe).
const moduleRoutes: RouteObject[] = NAV_ALL.map((n) => {
  if (n.end) return { index: true, element: <Dashboard /> }
  if (n.path === '/transactions') return { path: 'transactions', element: <Transactions /> }
  if (n.path === '/budgets') return { path: 'budgets', element: <Budgets /> }
  if (n.path === '/objectifs') return { path: 'objectifs', element: <Objectifs /> }
  if (n.path === '/comptes') return { path: 'comptes', element: <Comptes /> }
  if (n.path === '/pret') return { path: 'pret', element: <Pret /> }
  if (n.path === '/analytics') return { path: 'analytics', element: <Analytics /> }
  return { path: n.path.slice(1), element: <ModulePage title={n.label} /> }
})

// Détails (page pleine) — hors NAV, enfants de l'AppShell (shell persistant).
const appRoutes: RouteObject[] = [
  ...moduleRoutes,
  { path: 'budgets/:id', element: <BudgetDetail /> },
  { path: 'objectifs/:id', element: <ObjectifDetail /> },
  { path: 'comptes/:id', element: <ComptesDetail /> },
]

export const router = createBrowserRouter([
  // App (shell) — sous garde : authentifié + onboardé.
  {
    path: '/',
    element: <RequireAuth />,
    children: [{ element: <AppShell />, children: appRoutes }],
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
