---
description: Scaffolde un écran fidèle au wireframe (tokens, money(), états, 390/1440, clair/sombre)
argument-hint: <NomEcran> (ex. Dashboard, Transactions, BudgetDetail)
---

Tu vas scaffolder l'écran **$ARGUMENTS** pour Cauris, **fidèle à 100 % au wireframe**.

## Sources de vérité (à lire AVANT de coder)

- `PLAN-DEV-CAURIS.md` — parcours produit, inventaire des écrans (§1.7), navigation (§1.5), règles IA (§1.6).
- `CLAUDE.md` — règles de rendu / formatage / domaine non négociables.
- `design/wireframe/` — **référence de fidélité (ne pas modifier)** : les `.jsx` (`wf-lib.jsx`, `shell.jsx`, `screens-*.jsx`, `dashboard-*.jsx`) et les 8 captures `screenshots/`. Repère le ou les artboards correspondant à **$ARGUMENTS** et porte le rendu à l'identique.
- `src/styles/tokens.css` — source de vérité des couleurs.

## Contraintes de réalisation

1. **Couleurs** : uniquement via les variables de `tokens.css`. Aucune couleur en dur ; si une couleur manque, l'ajouter comme token.
2. **Montants** : via `src/lib/money.ts` (`money()`, séparateur U+202F), suffixe `FCFA` à part, chiffres en police **mono** (`--mono`). Solde masqué `••• •••`. Dates FR abrégées (`28 mai`, `Auj.`, `Hier`).
3. **Primitives maison** : `Icon, Donut, Gauge, Bars, Spark, Progress` (pas de lib de graphes).
4. **Responsive** : l'écran existe proprement en **390 px** (mobile-first) **et 1440 px** (desktop), en thème **clair ET sombre** + glass.
5. **États obligatoires** : **vide / succès / erreur** soignés, plus chargement explicite (TanStack Query).
6. **Navigation** : respecter la loi `vue globale → filtre → détail → action → retour au contexte` ; filtres persistants ; liens transverses **fonctionnels** (cf. CLAUDE.md / PLAN §1.5).
7. **IA** (si l'écran en contient) : suggestion confirmable / corrigeable / ignorable ; jamais d'action financière sans validation explicite.
8. **Composants** : TSX, petits et composables, dans `src/components/` ; l'écran dans `src/screens/` ; CSS Modules + variables.
9. **Accessibilité** : focus visible, clavier, ARIA, contrastes clair/sombre.

## Livrable

- L'écran `$ARGUMENTS` rendu, branché sur des données (réelles ou mock selon la phase), avec ses états.
- `npm run check` vert.
- Terminer par `/revue-fidelite` puis `/snapshot` pour le gate visuel.
