# Cauris

Application de finances personnelles (marché Côte d'Ivoire, FCFA). Mobile-first **390 px** + desktop **1440 px**, thèmes clair et sombre.

## Stack

- Vite + React 18 + TypeScript (strict)
- Styling à venir : `tokens.css` (variables CSS) + CSS Modules

> Tooling complémentaire (Supabase, TanStack Query, Vitest, Playwright, ESLint/Prettier) ajouté dans les étapes suivantes de la Phase 0.

## Démarrer

```bash
npm install
npm run dev      # serveur de dev
npm run build    # build de production (tsc + vite)
npm run preview  # prévisualiser le build
```

## Arborescence

```
src/
  components/  # composants réutilisables
  screens/     # écrans / pages
  lib/         # utilitaires, accès données
  hooks/       # hooks React
  styles/      # tokens.css + CSS Modules
```

## Documentation

- `PLAN-DEV-CAURIS.md` — plan de développement par phases.
- `CLAUDE.md` — règles projet (rendu, formatage, domaine, navigation).
