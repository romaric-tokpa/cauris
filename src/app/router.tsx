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
import { Notifications } from '../screens/notifications'
import { Assistant, Previsions, Anomalies } from '../screens/assistant'
import { Settings } from '../screens/settings'
import { AuthLayout } from '../screens/auth/AuthLayout'
import { Login } from '../screens/auth/Login'
import { Signup } from '../screens/auth/Signup'
import { ForgotPassword } from '../screens/auth/ForgotPassword'
import { ResetPassword } from '../screens/auth/ResetPassword'
import { OnboardingWizard } from '../screens/onboarding/OnboardingWizard'
import { RequireAuth, RequireGuest, RequireOnboarding } from './guards'

/**
 * IMPORTS STATIQUES VOLONTAIRES (pas de lazy-load des écrans).
 *
 * Le lazy-load — `React.lazy` + `<Suspense>` AUTANT QUE le `lazy` NATIF de react-router —
 * introduit une RÉGRESSION P0 avec le data-router v7 : la résolution ASYNCHRONE de l'écran
 * fait que la navigation reste une transition React concurrente non stabilisée pendant que
 * l'écran est déjà interactif. Un clic immédiat post-navigation (ex. « Ajouter une
 * transaction ») émet alors un `setState` rattaché à un rendu concurrent JETÉ → l'overlay
 * ne s'ouvre jamais (boutons « morts »). Le `lazy` natif RÉDUIT la fenêtre (chunk chargé
 * avant montage) mais ne l'élimine PAS (micro-gap `import()` ; échecs au montage rapide /
 * revisite d'écran cache). Seuls les imports STATIQUES rendent la navigation SYNCHRONE →
 * zéro course (vérifié 8/8, cf. e2e/post-nav-interaction.spec.ts).
 *
 * Conséquence : pas de code-splitting par route (le boot charge les écrans ; ils sont
 * légers, le vendor domine). Le code-splitting est un CHANTIER FUTUR à réaliser via une
 * approche SANS course (prefetch des chunks en idle après le 1ᵉʳ paint → navigations
 * effectivement synchrones), pas via un simple lazy de route.
 */

// Modules en routes enfants de l'AppShell, dérivés de NAV (libellés 1:1 du wireframe).
const moduleRoutes: RouteObject[] = NAV_ALL.map((n) => {
  if (n.end) return { index: true, element: <Dashboard /> }
  if (n.path === '/transactions') return { path: 'transactions', element: <Transactions /> }
  if (n.path === '/budgets') return { path: 'budgets', element: <Budgets /> }
  if (n.path === '/objectifs') return { path: 'objectifs', element: <Objectifs /> }
  if (n.path === '/comptes') return { path: 'comptes', element: <Comptes /> }
  if (n.path === '/pret') return { path: 'pret', element: <Pret /> }
  if (n.path === '/analytics') return { path: 'analytics', element: <Analytics /> }
  if (n.path === '/notifications') return { path: 'notifications', element: <Notifications /> }
  if (n.path === '/assistant-ia') return { path: 'assistant-ia', element: <Assistant /> }
  if (n.path === '/parametres') return { path: 'parametres', element: <Settings /> }
  // Fallback défensif : un item de NAV sans écran dédié (aucun aujourd'hui).
  return { path: n.path.slice(1), element: <ModulePage title={n.label} /> }
})

// Détails (page pleine) — hors NAV, enfants de l'AppShell (shell persistant).
const appRoutes: RouteObject[] = [
  ...moduleRoutes,
  { path: 'budgets/:id', element: <BudgetDetail /> },
  { path: 'objectifs/:id', element: <ObjectifDetail /> },
  { path: 'comptes/:id', element: <ComptesDetail /> },
  // Onglets du module IA (AISub) — pages pleines sous le shell.
  { path: 'assistant-ia/previsions', element: <Previsions /> },
  { path: 'assistant-ia/anomalies', element: <Anomalies /> },
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
