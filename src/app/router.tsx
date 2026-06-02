/* eslint-disable react-refresh/only-export-components -- fichier de CONFIG de routes :
   les const lazy() ne sont pas des modules Fast-Refresh, et le seul export est `router`. */
import { lazy, Suspense, type ReactElement } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { AppShell } from '../components/shell'
import { NAV_ALL } from '../components/shell/nav'
import { ModulePage } from '../screens/ModulePage'
import { AuthLayout } from '../screens/auth/AuthLayout'
import { RequireAuth, RequireGuest, RequireOnboarding, RouteFallback } from './guards'

/**
 * Écrans en **lazy-load** (code-splitting par route) : chaque module n'est téléchargé
 * qu'à la première navigation vers lui, pas au boot. Les layouts/gardes (AppShell,
 * AuthLayout, guards) et le fallback ModulePage restent en import statique (toujours
 * nécessaires). Les frontières <Suspense> vivent dans AppShell/AuthLayout (autour de
 * l'<Outlet/>) ; l'onboarding (sans layout) enveloppe son élément ci-dessous.
 */
const Dashboard = lazy(() => import('../screens/dashboard').then((m) => ({ default: m.Dashboard })))
const Transactions = lazy(() => import('../screens/transactions').then((m) => ({ default: m.Transactions })))
const Budgets = lazy(() => import('../screens/budgets').then((m) => ({ default: m.Budgets })))
const BudgetDetail = lazy(() => import('../screens/budgets').then((m) => ({ default: m.BudgetDetail })))
const Objectifs = lazy(() => import('../screens/objectifs').then((m) => ({ default: m.Objectifs })))
const ObjectifDetail = lazy(() => import('../screens/objectifs').then((m) => ({ default: m.ObjectifDetail })))
const Comptes = lazy(() => import('../screens/comptes').then((m) => ({ default: m.Comptes })))
const ComptesDetail = lazy(() => import('../screens/comptes').then((m) => ({ default: m.ComptesDetail })))
const Pret = lazy(() => import('../screens/pret').then((m) => ({ default: m.Pret })))
const Analytics = lazy(() => import('../screens/analytics').then((m) => ({ default: m.Analytics })))
const Notifications = lazy(() => import('../screens/notifications').then((m) => ({ default: m.Notifications })))
const Assistant = lazy(() => import('../screens/assistant').then((m) => ({ default: m.Assistant })))
const Previsions = lazy(() => import('../screens/assistant').then((m) => ({ default: m.Previsions })))
const Anomalies = lazy(() => import('../screens/assistant').then((m) => ({ default: m.Anomalies })))
const Settings = lazy(() => import('../screens/settings').then((m) => ({ default: m.Settings })))
const Login = lazy(() => import('../screens/auth/Login').then((m) => ({ default: m.Login })))
const Signup = lazy(() => import('../screens/auth/Signup').then((m) => ({ default: m.Signup })))
const ForgotPassword = lazy(() => import('../screens/auth/ForgotPassword').then((m) => ({ default: m.ForgotPassword })))
const ResetPassword = lazy(() => import('../screens/auth/ResetPassword').then((m) => ({ default: m.ResetPassword })))
const OnboardingWizard = lazy(() => import('../screens/onboarding/OnboardingWizard').then((m) => ({ default: m.OnboardingWizard })))

/** Enveloppe un élément lazy d'une frontière Suspense (cas sans layout : onboarding). */
function suspended(node: ReactElement): ReactElement {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>
}

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
  // Onboarding (plein écran, sans layout) — garde : authentifié, pas encore onboardé.
  {
    path: '/onboarding',
    element: <RequireOnboarding />,
    children: [{ index: true, element: suspended(<OnboardingWizard />) }],
  },
])
