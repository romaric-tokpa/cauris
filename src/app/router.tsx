import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { AppShell } from '../components/shell'
import { NAV_ALL } from '../components/shell/nav'
import { ModulePage } from '../screens/ModulePage'
import { FullScreenPlaceholder } from '../screens/FullScreenPlaceholder'

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
  // HORS shell (plein écran) — contenu réel en Phase 2.
  {
    path: '/auth',
    element: (
      <FullScreenPlaceholder
        title="Connexion"
        text="L’authentification (connexion / inscription) arrive en Phase 2."
      />
    ),
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
