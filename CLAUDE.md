# CLAUDE.md — Cauris (finances personnelles)

Règles projet chargées à chaque session. **Source de vérité du rendu : `src/styles/tokens.css`.** En cas de doute sur la structure/parcours produit, voir `PLAN-DEV-CAURIS.md`.

## Produit

- App de finances personnelles **Cauris**, marché **Côte d'Ivoire**. Langue : **français**.
- Utilisatrice de démo : **Aïcha**. Période de réf. : **Mai 2026**.
- Mobile-first **390 px** + desktop **1440 px** : tout écran existe proprement aux deux largeurs, en thème **clair ET sombre**.

## Stack (arrêtée)

- Vite + React 18 + **TypeScript strict** (front SPA).
- Styling : **`tokens.css` (variables CSS) + CSS Modules**. Préférer les variables aux couleurs en dur.
- Données serveur : **TanStack Query** (front).
- **Backend : Hono** (obligatoire) — porte l'API : accès données, auth, proxy IA.
- **Base : Turso (libSQL/SQLite)** via **Drizzle ORM** (`drizzle-orm/libsql`) + **drizzle-kit** (migrations). Dev = fichier SQLite local, prod = Turso. Le token Turso reste **serveur**, jamais dans le navigateur.
- **Auth : Better Auth** (adapter Drizzle, `provider: "sqlite"`) monté sur Hono. Auto-hébergée, pas de service tiers.
- **Contrôle d'accès** : pas de RLS — toute requête est **scopée au `user_id` authentifié dans la couche serveur**. Ne jamais renvoyer de données non scopées.
- IA : **API Anthropic appelée côté serveur uniquement** (route Hono), la clé ne touche jamais le client.
- Tests : Vitest + RTL (unités), **Playwright** (e2e + régression visuelle).

## Rendu — non négociable

- **Couleurs** : uniquement via les variables de `tokens.css`. Ne jamais coder une couleur en dur dans un composant. Si une couleur manque, l'ajouter comme token, pas en local.
- **Polices** : `Public Sans` pour le texte, `Spline Sans Mono` pour **tous les chiffres/montants**.
- **Thème** : `data-theme` clair/sombre, `data-glass` on/off, `--accent` réglable, option `brandNav` (accent sur la nav). Les washes dérivent via `color-mix(... , --paper)` et s'adaptent au sombre automatiquement.
- **Graphes** : utiliser les primitives maison (`Donut`, `Gauge`, `Bars`, `Spark`, `Progress`, `Icon`). Préférer ces composants à toute librairie de graphes (le rendu doit rester pixel-identique au wireframe).

## Formatage — non négociable

- **Montants** : via l'util `money()`. Groupement des milliers par **espace fine insécable** (`\u202f`, ex. `2 480 000`), format francophone. Suffixe `FCFA` rendu à part, chiffres en police **mono**. **Stockage en entiers FCFA** (pas de centimes, jamais de float).
- **Solde masqué** (compte bloqué) : `••• •••`.
- **Dates** : francophone abrégé (`28 mai`, `15 juin 2026`, `Auj.`, `Hier`).
- **Tons sémantiques** : `pos` (revenus/positif), `neg` (dépassement/alerte), `warn` (avertissement), `ok`/neutre.

## Domaine (cohérence des seeds et exemples)

- Comptes : **NSIA Banque**, **Ecobank**, **Orange Money**, **Wave** (mobile money). Un compte peut être _bloqué_.
- Vendeurs/services : Marché de Cocody, Supermarché Prosuma, **SODECI** (eau), **CIE** (électricité), **Yango**, Glovo, Canal+, Spotify, Pharmacie Plateau.
- Catégories : Alimentation, Logement, Transport, Factures, Loisirs, Santé, Revenu, Transfert, Retrait.
- Ne pas introduire de marques/devises hors contexte ivoirien dans les données d'exemple.

## Navigation

- Pattern **A « Cockpit »** validé : sidebar gauche fixe + header (recherche, sélecteur période _Semaine/Mois/Année_, notifications, profil). Mobile : **barre basse + bouton flottant `+`**.
- Loi : **vue globale → filtre → détail → action → retour au contexte**. Les filtres **persistent** au retour de détail.
- Les liens transverses sont **fonctionnels** : Dashboard→Transactions filtrées / détail budget / détail objectif / détail prêt / Assistant IA ; Budget→transactions liées ; Compte→opérations filtrées ; Analytics→catégorie filtrée ; Notification→écran contextuel ; Assistant IA→module source.
- Formulaires courts → **drawer (desktop) / bottom sheet (mobile)** ; écrans complexes (détail budget, prêt, simulation) → **page pleine**.

## Conventions composants

- Composants en **TSX**. Préférer des composants petits et composables.
- **Chaque liste/écran de données** fournit ses états **vide / succès / erreur** (soignés — ils portent la confiance).
- Préférer les états de chargement explicites (TanStack Query) plutôt que des écrans blancs.
- Accessibilité : focus visible, navigation clavier, ARIA sur les contrôles, contrastes respectés en clair et sombre.

## Couche IA — règles métier

- Toute suggestion IA est **confirmable / corrigeable / ignorable**.
- Une correction manuelle **améliore** les futures propositions sur libellés/patterns similaires.
- Une **anomalie** est expliquée par comparaison à l'historique (compte / vendeur / catégorie).
- Une **prévision** affiche son **horizon**, son **niveau de confiance** et les **données utilisées**.
- Une **recommandation** est reliée à un objectif concret (budget, dette, épargne, trésorerie, charge récurrente).
- **L'IA ne déclenche jamais une action financière sans validation explicite de l'utilisateur.**

## Fidélité au wireframe

- **Source de vérité : `design/wireframe/*.jsx`** (lecture seule). Porter chaque écran depuis son composant d'origine. Les PNG de `design/wireframe/screenshots/` sont des sanity visuelles **desktop uniquement** (pas de mobile ; fond canvas/scroll/bug d'échappement → **jamais** des baselines pixel).
- Un écran est « fini » après : `/revue-fidelite` PASS (rendu vs source `.jsx` + checklist §6) **et** baseline de régression Playwright auto-générée (clair+sombre, 390+1440) dans `e2e/baselines/`.
- En fin de tâche d'écran : dérouler la checklist (couleurs/tokens, `money()`/`\u202f`, états, navigation).

## Avant de considérer une tâche « finie »

- Lancer `npm run check` (lint + types + tests) — doit être vert.
- Faire relire le diff dans un contexte neuf (sous-agent / `/code-review`).
- Vérifier le snapshot visuel de l'écran touché.
