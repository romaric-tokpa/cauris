# Plan de développement — Cauris (application de finances personnelles)

> **But du document** : planifier le développement _complet_ de l'application, **fidèle à 100 % aux wireframes** fournis, et piloté avec **Claude Code CLI**.
> Ce fichier est conçu pour vivre à la racine du dépôt (`PLAN.md`). On y revient à chaque phase ; le `CLAUDE.md` (voir §3) en est le résumé exécutable que Claude Code charge automatiquement.

---

## 1. Ce que les wireframes imposent (la « source de vérité »)

Avant de planifier, on fige ce qui ne doit **jamais** dériver. C'est extrait directement du projet joint (`wf-lib.jsx`, `Wireframes Dashboard.html`, `app.jsx`).

### 1.1 Identité produit

- **Nom** : Cauris. Utilisatrice de référence : **Aïcha**. Période de référence : **Mai 2026**.
- **Marché** : Côte d'Ivoire / Afrique de l'Ouest. Devise **FCFA**.
- **Comptes** : NSIA Banque, Ecobank, **Orange Money**, **Wave** (mobile money). Un compte peut être _bloqué_ (solde masqué `••• •••`).
- **Vendeurs / services réels** : Marché de Cocody, Supermarché Prosuma, **SODECI** (eau), **CIE** (électricité), **Yango**, Glovo, Canal+, Spotify, Pharmacie Plateau.
- **Catégories** : Alimentation, Logement, Transport, Factures, Loisirs, Santé, Revenu, Transfert, Retrait.

### 1.2 Tokens de design (à porter tels quels, ne pas réinventer)

| Token                                  | Clair                                | Sombre                            | Usage                                      |
| -------------------------------------- | ------------------------------------ | --------------------------------- | ------------------------------------------ |
| `--paper`                              | `#ffffff`                            | `#1c1c21`                         | fond des cartes                            |
| `--bg`                                 | `#ecebe6`                            | `#131316`                         | fond global                                |
| `--panel` / `--panel-2`                | `#f5f5f2` / `#efeeea`                | `#232329` / `#2d2d35`             | surfaces secondaires                       |
| `--ink` / `--ink-soft` / `--ink-faint` | `#20201f` / `#5f5f63` / `#9a9a9e`    | `#f2f2ef` / `#a8a8b0` / `#74747d` | texte                                      |
| `--line` / `--line-soft`               | `#d8d7d2` / `#e8e7e2`                | `#34343d` / `#292930`             | bordures                                   |
| `--accent`                             | `#2f5d8c` (bleu sourd, **réglable**) | idem                              | signal principal                           |
| `--pos`                                | `#2f7d57`                            | `#54c389`                         | positif / revenus                          |
| `--neg`                                | `#b8462f`                            | `#e3795f`                         | dépassement / alerte                       |
| `--warn`                               | `#b07d18`                            | `#d8a747`                         | avertissement                              |
| `--*-wash`                             | `color-mix(... 14–16% , --paper)`    | auto                              | fonds d'état (s'adaptent au dark)          |
| `--solid` / `--feature`                | `#1d1d1f`                            | `#f1f1ee` / `#26262d`             | boutons primaires, nav active, cartes hero |

- **Polices** : `Public Sans` (texte) + `Spline Sans Mono` (tous les **chiffres / montants**).
- **Thèmes & tweaks** : `data-theme` clair/sombre, `data-glass` on/off (« verre dépoli / Liquid Glass »), accent réglable parmi `#2f5d8c #1f7a5b #c2603f #5a55c8 #9d4068`, option « accent sur la navigation » (`brandNav`).
- **Breakpoints de référence** : desktop **1440 px**, mobile **390 px**. Tout écran doit exister proprement aux deux.

### 1.3 Règles de formatage (non négociables)

- **Montants** : groupement des milliers par **espace fine insécable** (`\u202f`), format francophone, jamais de séparateur anglo-saxon. Réimplémenter la fonction `money()` à l'identique, suffixe `FCFA` à part, rendu en police **mono**.
- **Solde masqué** : `••• •••` (compte bloqué).
- **Dates** : francophone abrégé (`28 mai`, `15 juin 2026`, `Auj.`, `Hier`).

### 1.4 Composants visuels faits main (à reproduire, pas à remplacer par une lib)

Le wireframe n'utilise **aucune** librairie de graphes — c'est un choix esthétique. Pour rester fidèle, on **porte les primitives** :

- `Donut` (conic-gradient, trou réglable, libellé central),
- `Gauge` (demi-cercle SVG, couleur selon ton ok/warn/over),
- `Bars` (cashflow, barres revenus/dépenses en hauteur CSS),
- `Spark` (sparkline path + remplissage `--accent-wash`),
- `Progress` (barre avec ton),
- jeu d'icônes **SVG inline** (`Icon name=…`, ~50 glyphes : grid, exchange, gauge, target, wallet, bank, bell, repeat, trendUp, alert…).

> Recharts/Chart.js sont autorisés **seulement** si le rendu pixel reste identique ; par défaut, on garde les composants maison.

### 1.5 Patterns de navigation imposés

- **Desktop pattern A « Cockpit »** (sidebar gauche fixe + header : recherche, sélecteur de période _Semaine/Mois/Année_, notifications, profil) = **pattern validé / primaire**. Pattern B « signal d'abord » (nav horizontale) = variante documentée.
- **Mobile** : barre basse (modules clés) + **bouton flottant +** = variante **validée** ; feed/pill nav = variante.
- **Loi de navigation** : `vue globale → filtre → détail → action → retour au contexte`. Les liens transverses (Dashboard→Transactions filtrées, Budget→transactions liées, Analytics→catégorie, Notification→écran contextuel, Assistant IA→module source) sont _fonctionnels_, pas décoratifs.
- **Formulaires** : courts → **drawer/bottom sheet** ; complexes (détail budget, prêt, simulation) → **page pleine**.

### 1.6 Règles métier IA (à respecter dans toute la couche IA)

- Toute suggestion IA est **confirmable / corrigeable / ignorable**.
- Une correction manuelle **améliore** les propositions futures sur libellés/patterns similaires.
- Une anomalie est **expliquée** par comparaison à l'historique (compte / vendeur / catégorie).
- Une prévision affiche **horizon + niveau de confiance + données utilisées**.
- Une recommandation est **reliée à un objectif concret** (budget, dette, épargne, trésorerie, charge récurrente).
- **L'IA n'exécute jamais une action financière sans validation explicite.**

### 1.7 Inventaire des écrans (≈ 40 artboards à livrer)

| Module        | Écrans (desktop / mobile)                                                 | Parcours   |
| ------------- | ------------------------------------------------------------------------- | ---------- |
| Auth          | Connexion, Inscription (mobile)                                           | 1          |
| Onboarding    | 5 étapes (profil, préférences, revenus/dépenses, 1er objectif, comptes)   | 1          |
| Dashboard     | Desktop A + B, Mobile A + B                                               | transverse |
| Transactions  | Desktop liste+drawer, Mobile liste, Mobile ajout (sheet)                  | 2          |
| Budgets       | Desktop liste, Desktop détail (dépassement), Mobile liste                 | 3          |
| Objectifs     | Desktop détail+drawer contribution, Mobile liste                          | 4          |
| Comptes       | Desktop liste, Mobile détail compte                                       | 5          |
| Prêt / Dette  | Desktop vue générale, amortissement, paiements, simulation, Mobile détail | 6          |
| Analytics     | Desktop overview, catégories, tendances, budget vs réel, Mobile overview  | 7          |
| Notifications | Desktop liste, Mobile liste                                               | 8          |
| Assistant IA  | Desktop assistant, insights, prévisions, anomalies, Mobile assistant      | 9–12       |
| Paramètres    | Desktop préférences+sécurité, Mobile réglages                             | —          |
| États         | Vide, Confirmation, Erreur (mobile)                                       | transverse |

---

## 2. Stack recommandée (fidèle + pragmatique pour un dev solo + Claude Code)

Recommandation par défaut (un choix clair, alternatives notées) :

- **Front** : **Vite + React 18 + TypeScript**. SPA, léger, rapide, sans friction — colle au wireframe qui est déjà du React client.
- **Styling** : **`tokens.css` (variables CSS portées à l'identique) + CSS Modules**. Tailwind v4 _optionnel_ (il sait gérer `color-mix` et le theming par variables) — mais le `tokens.css` reste la **source de vérité** des couleurs.
- **Données serveur** : **TanStack Query** (cache, états de chargement/erreur → utile pour les états « soignés »).
- **Base de données** : **Turso** (libSQL / SQLite edge) + **Drizzle ORM** (`drizzle-orm/libsql`) + **drizzle-kit** pour les migrations (`db:generate` / `db:migrate` / `db:studio`). Connexion via `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (jamais côté navigateur). **Dev = fichier SQLite local**, **prod = Turso**, même client libSQL.
- **Backend (indispensable avec Turso)** : **Hono** — serveur léger (Node en dev, déployable edge) qui porte l'API : accès aux données Turso, authentification, et **proxy sécurisé vers l'API Anthropic** (la clé reste serveur).
- **Authentification** : **Better Auth** (lib TypeScript framework-agnostic) avec son **adapter Drizzle** (`provider: "sqlite"`) et l'intégration **Hono**. Auto-hébergée, aucun service tiers. Variables : `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.
- **Contrôle d'accès** : pas de Row-Level Security façon Postgres → **portée par utilisateur appliquée dans la couche serveur/requêtes** (chaque requête scopée au `user_id` authentifié).
- **Couche IA** : **API Anthropic (Messages API)** appelée **côté serveur uniquement** (route Hono), avec un modèle Claude courant. Réf. produit : `docs.claude.com`.
- **Tests & fidélité** : **Vitest + React Testing Library** (unités), **Playwright** (e2e des 12 parcours **+ régression visuelle** contre les captures du wireframe — c'est le garde-fou de fidélité), **Storybook** _optionnel_ pour les primitives.
- **Qualité** : ESLint + Prettier + TypeScript strict + Husky (pre-commit).

> Décision à acter en Phase 0 et à figer dans `CLAUDE.md`. L'archi cible : **front Vite (SPA) + backend Hono + Turso (Drizzle)** — le backend est obligatoire dès qu'on parle de Turso (token DB serveur) et d'IA (clé Anthropic serveur).

---

## 3. Méthode Claude Code CLI (le « comment »)

Le plan suppose un rythme régulier, une phase = un cycle :

```
1 phase  →  Plan Mode (recherche + plan, validé par toi)
         →  exécution (Claude Code écrit le code)
         →  revue par sous-agent en contexte neuf (/code-review)
         →  gate de fidélité (snapshot Playwright vs capture wireframe)
         →  commit + on passe à la phase suivante
```

### 3.1 `CLAUDE.md` (le fichier le plus important)

Claude Code le charge **automatiquement** dans le contexte à chaque session. On y met les règles que Claude _ne doit pas_ oublier (formulées « préférer X » plutôt que « ne pas »). Contenu minimal :

- Stack arrêtée + arborescence des dossiers.
- **Les tokens du §1.2** (ou un renvoi à `tokens.css` comme source de vérité).
- La règle `money()` / espace fine `\u202f` / mono pour les chiffres.
- Mobile-first 390 ↔ desktop 1440 ; pattern A validé.
- Domaine FCFA + comptes/vendeurs ivoiriens (pour que les seeds et exemples restent cohérents).
- **« L'IA ne déclenche jamais une action financière sans validation explicite. »**
- Conventions : composants en TSX, primitives de graphes maison, états vide/succès/erreur obligatoires sur chaque liste.
- Commande de vérif rapide (lint + types + tests) à lancer avant de considérer une tâche « finie ».

### 3.2 Outils Claude Code à utiliser

- **Plan Mode** (`Shift+Tab` deux fois, ou `/plan`) : pour chaque phase, faire produire un plan _avant_ tout code, le valider, puis exécuter. Évite que Claude code la mauvaise chose.
- **Sous-agents** : `Explore` (recherche rapide dans le code, économise le contexte) en début de phase ; un sous-agent **revue de diff** en fin de phase. La compétence intégrée **`/code-review`** relit le diff dans un contexte neuf et remonte les bugs.
- **Slash commands custom** (dans `.claude/commands/`) : par ex. `/nouvel-ecran`, `/snapshot`, `/revue-fidelite` pour standardiser les prompts récurrents.
- **MCP** : connecter Supabase / la doc si besoin, en accordant explicitement les droits aux sous-agents.
- **Worktrees** : pour mener 2 phases indépendantes en parallèle sans collision (ex. Analytics et Prêt).

### 3.3 Gate de fidélité visuelle (clé du « 100 % fidèle »)

**Source de vérité = le code source du wireframe** (`design/wireframe/*.jsx`), pas les captures. Les 8 PNG sont des captures 1440×842 de l'outil canvas (fond quadrillé, libellés d'artboards, overlays, scroll partiel, et même le bug d'échappement `\u2014`) et **ne contiennent aucune vue mobile** → inutilisables comme baselines pixel.

Modèle à deux niveaux :

- **Intention (humain / `/revue-fidelite`)** : porter chaque écran depuis son composant `.jsx` d'origine ; juger le rendu contre ce source + la capture desktop correspondante comme sanity visuelle. Verdict PASS/FAIL sur la checklist §6.
- **Régression (automatique)** : Playwright `toHaveScreenshot` avec baselines **auto-générées au premier rendu validé** de chaque écran (clair+sombre, 390+1440), stockées dans `e2e/baselines/`. Protègent des **dérives futures**, pas contre les PNG du canvas.
- **Ne jamais** pointer `toHaveScreenshot` sur `design/wireframe/screenshots/` (échec garanti + zéro réf. mobile).

---

## 4. Le plan en phases

Chaque phase indique : **Objectif · Périmètre · Livrables · Definition of Done (DoD) + critère de fidélité · Prompt Claude Code de départ.**

### Phase 0 — Fondations & cadrage _(socle Claude Code)_

- **Objectif** : repo prêt, stack actée, garde-fous en place.
- **Périmètre** : init Vite+TS, **backend Hono + Turso/Drizzle (client + drizzle-kit)**, lint/format/TS strict, Vitest+Playwright, CI minimale, `CLAUDE.md`, `tokens.css`, import des captures comme références visuelles, slash commands.
- **Livrables** : projet qui build + `npm run check` (lint+types+tests) vert + pipeline Playwright qui sait charger les références.
- **DoD / fidélité** : `tokens.css` reproduit **exactement** le `:root` et `[data-theme="dark"]` du wireframe ; polices chargées (Public Sans + Spline Sans Mono).
- **Prompt CC** : _« Plan Mode. Initialise un projet Vite+React+TS avec un backend Hono, Turso (client libSQL + Drizzle + drizzle-kit), Vitest, Playwright, ESLint/Prettier. Crée `tokens.css` en copiant à l'identique les variables CSS de `Wireframes Dashboard.html`. Crée `CLAUDE.md` avec les règles du PLAN.md §3.1. Ne code pas d'écran encore. »_

### Phase 1 — Design system & shell _(le squelette fidèle)_

- **Objectif** : tous les primitifs + le shell de navigation, theming complet.
- **Périmètre** : primitives `Icon, Donut, Gauge, Bars, Spark, Progress`, util `money()` + dates FR ; composants de base `Card, Button, Badge/Tag, KpiTile, Drawer, BottomSheet, Modal` ; **Shell desktop** (sidebar Cockpit A + header recherche/période/notif/profil) ; **Shell mobile** (barre basse + FAB) ; bascule thème clair/sombre, glass, accent, brandNav ; routing vide vers les 12 modules ; **3 états** (vide/succès/erreur).
- **Livrables** : Storybook (optionnel) ou page de démo listant tous les primitifs ; shell navigable.
- **DoD / fidélité** : snapshot du shell ≈ capture `canvas.png` / `dark.png` ; `money(2480000)` → `2 480 000` (espaces fines) ; mono sur les chiffres.
- **Prompt CC** : _« Plan Mode. Porte les primitives de `wf-lib.jsx` en TSX (Donut, Gauge, Bars, Spark, Progress, Icon, money). Construis le Shell desktop (sidebar A + header) et mobile (barre basse + FAB) avec theming clair/sombre/glass/accent. Ajoute les écrans d'état vide/succès/erreur. Gate visuel contre canvas.png et dark.png. »_

### Phase 2 — Authentification & Onboarding _(parcours 1)_

- **Objectif** : entrée dans l'app + paramétrage initial.
- **Périmètre** : Connexion, Inscription, mot de passe oublié/réinit ; 5 étapes onboarding (profil → préférences → revenus/dépenses → 1er objectif → comptes initiaux) ; **auth via Better Auth (adapter Drizzle/sqlite) montée sur Hono** ; redirection onboarding→dashboard.
- **DoD / fidélité** : écrans 390 px conformes ; flux complet inscription→dashboard ; états d'erreur soignés.
- **Prompt CC** : _« Plan Mode. Implémente Better Auth (email) avec l'adapter Drizzle/sqlite monté sur Hono + les écrans auth/onboarding (parcours 1 du PLAN.md). Wizard 5 étapes avec persistance. Gate visuel mobile. »_

### Phase 3 — Modèle de données & socle métier _(le cœur invisible)_

- **Objectif** : schéma + seed identique au wireframe, utilitaires.
- **Périmètre** : schéma **Drizzle (libSQL/SQLite)** : `accounts, categories, transactions, budgets, goals, contributions, loans, amortization, loan_payments, notifications, recurrences`, + `ai_insights, ai_anomalies, ai_forecasts, ai_chat`. **Contrôle d'accès applicatif** : toutes les requêtes scopées au `user_id` authentifié (pas de RLS Postgres). **Montants stockés en entiers FCFA** (pas de centimes), dates en ISO texte. **Migrations via drizzle-kit** + **seed** avec les données exactes de `wf-lib.jsx` (Aïcha, NSIA/Ecobank/Orange Money/Wave, SODECI, CIE, prêt auto 3,2 M restant @9,5 %, objectifs Fonds d'urgence/Voyage Dakar/Ordinateur, etc.).
- **DoD / fidélité** : l'app, branchée sur la BDD seedée, **rend les mêmes chiffres** que le wireframe (solde 2 480 000, dépenses mai 612 000, budget Transport 108 %…).
- **Dette héritée (onboarding § Phase 2)** : à la création de la table `goals`, **rendre saisissables** les champs **Date cible** et **Montant cible** de l'**onboarding étape 4** (premier objectif) et **persister réellement** l'objectif créé. En Phase 2 ces champs étaient **figés** (données non persistées, pas de table métier). En revanche **Pays / Devise restent figés** (Côte d'Ivoire / FCFA — contexte produit).
- **Prompt CC** : _« Plan Mode. Conçois le schéma Drizzle/libSQL pour Cauris (voir PLAN.md §4 Phase 3), montants en entiers FCFA, accès scopé au user_id côté serveur. Écris les migrations drizzle-kit + un seed reprenant à l'identique les données de wf-lib.jsx. »_

### Phase 4 — Dashboard _(cœur + liens transverses)_

- **Objectif** : le cockpit central, données réelles, navigation transverse câblée.
- **Périmètre** : KPI (solde/revenus/dépenses/épargne), `Bars` cashflow 6 mois, `Donut` répartition, budgets en alerte, objectifs en cours, transactions récentes, rappels/notifs, **widget Insights IA**, **alertes intelligentes** ; sélecteur de période ; liens : KPI dépenses→Transactions filtrées, budget→détail, objectif→détail, dette→détail prêt, insight→Assistant IA.
- **DoD / fidélité** : snapshot ≈ `full.png` desktop + dashboard mobile ; tous les liens transverses fonctionnent.
- **Prompt CC** : _« Plan Mode. Implémente le Dashboard desktop (pattern A) + mobile, branché sur les données réelles, avec tous les widgets et liens transverses du PLAN.md §1.5. Gate visuel vs full.png. »_

### Phase 5 — Transactions _(parcours 2)_

- **Périmètre** : liste + tabs (Tous/Revenus/Dépenses/Transferts/Récurrentes/À vérifier IA), filtres période/compte/catégorie persistants, détail, **ajout/édition en drawer (desktop) + bottom sheet (mobile)**, transferts internes, récurrentes, **badge « Suggestion IA »** (catégorisation), accroche détection d'anomalies.
- **DoD / fidélité** : snapshot ≈ capture `Transactions · Liste + drawer Ajouter` ; filtres conservés au retour de détail.
- **Prompt CC** : _« Plan Mode. Transactions (parcours 2) : liste filtrable + drawer/sheet d'ajout, types Dépense/Revenu/Transfert, montant en FCFA avec money(). Gate visuel desktop + mobile. »_

### Phase 6 — Budgets _(parcours 3)_

- **Périmètre** : liste (Actifs/En alerte/Dépassés/Archivés/Prévisions IA), **détail avec `Gauge`** (cas dépassement Transport 108 %), bouton **« Voir les transactions liées »** → liste filtrée, onglet **Prévisions IA de dépassement**, suggestions d'optimisation.
- **DoD / fidélité** : snapshot ≈ `budget-detail.png` ; parcours alerte→détail→transactions liées→retour fluide.
- **Prompt CC** : _« Plan Mode. Budgets (parcours 3) avec détail dépassement (Gauge), lien transactions liées, onglet Prévisions IA. Gate vs budget-detail.png. »_

### Phase 7 — Objectifs _(parcours 4)_

- **Périmètre** : liste (En cours/Atteints/En retard/Archivés/Conseils IA), détail + progression + date cible, **drawer « Ajouter une contribution »** (compte source + montant), historique contributions, **recommandations IA de contribution**.
- **DoD / fidélité** : snapshot ≈ `obj-desk.png` ; contribution met à jour la progression.
- **Prompt CC** : _« Plan Mode. Objectifs (parcours 4) : détail + drawer contribution + historique + conseil IA. Gate vs obj-desk.png. »_

### Phase 8 — Comptes _(parcours 5)_

- **Périmètre** : liste (Tous/Trésorerie/Épargne/Mobile money/Inactifs/Récurrences détectées), détail compte (solde, évolution `Spark`, dernières opérations), **compte bloqué `••• •••`**, bouton **« Voir toutes les opérations »** → Transactions filtrées compte, **détection IA des paiements récurrents**.
- **DoD / fidélité** : snapshot ≈ détail compte mobile ; lien compte→opérations conserve le filtre.
- **Prompt CC** : _« Plan Mode. Comptes (parcours 5) : liste typée + détail + lien opérations filtrées + récurrences détectées + état bloqué. »_

### Phase 9 — Prêt / Dette _(parcours 6)_

- **Périmètre** : vue générale (capital restant, mensualité, échéance, progression), **tableau d'amortissement**, paiements (À venir/Payé), **simulation** (remboursement anticipé / variation de mensualité → impact durée & coût), **conseils IA de pilotage de dette**.
- **DoD / fidélité** : snapshot ≈ `pret-sim.png` ; la simulation recalcule réellement durée/coût restant.
- **Prompt CC** : _« Plan Mode. Prêt/Dette (parcours 6) : vue générale + amortissement + paiements + simulateur de remboursement. Gate vs pret-sim.png. »_

### Phase 10 — Analytics _(parcours 7)_

- **Périmètre** : Overview, **Catégories** (clic catégorie → Transactions filtrées catégorie+période), **Tendances**, **Budget vs réel**, rapports exportables, **Prévisions IA**, **synthèse explicative IA**.
- **DoD / fidélité** : snapshot ≈ `ana-desk.png` ; navigation Analytics→catégorie conserve le contexte au retour.
- **Prompt CC** : _« Plan Mode. Analytics (parcours 7) : 4 vues + export + forecast IA + synthèse, avec drill-down vers transactions filtrées. Gate vs ana-desk.png. »_

### Phase 11 — Notifications _(parcours 8)_

- **Périmètre** : liste (lu/non lu, tons over/warn/ok), **deep-link contextuel** (budget dépassé→détail budget, échéance→prêt…), marquer lu/traité, **alertes intelligentes IA**.
- **DoD / fidélité** : chaque notification ouvre le bon écran contextuel.
- **Prompt CC** : _« Plan Mode. Notifications (parcours 8) : liste + deep-links contextuels + alertes IA. »_

### Phase 12 — Couche IA complète _(parcours 9–12)_

- **Objectif** : brancher l'intelligence, dans le respect strict des règles §1.6.
- **Périmètre** :
  - **Proxy serveur** vers l'API Anthropic (**route Hono**, clé côté serveur), endpoints : catégorisation, détection d'anomalies, prévisions (budget/trésorerie), recommandations, **chat assistant** (avec les suggestions de questions), **simulateur** (« si j'épargne 25 000 de plus… »).
  - Écrans **Assistant IA** (chat + insights + alertes + simulations + historique) desktop & mobile.
  - **Parcours 9** validation catégorisation (badge → confirmer/corriger/refuser → mémorisation).
  - **Parcours 10** alerte dépense inhabituelle → explication vs historique → normal / à surveiller.
  - **Parcours 11** conseil contextualisé avec lien vers module source.
  - **Parcours 12** simulation intelligente reliée à objectif/prêt.
- **DoD / fidélité** : aucune action financière déclenchée sans validation ; chaque prévision affiche horizon+confiance ; chaque anomalie est expliquée ; snapshot assistant ≈ capture assistant.
- **Prompt CC** : _« Plan Mode. Couche IA : route Hono proxy Anthropic (clé serveur), endpoints catégorisation/anomalies/prévisions/chat/simulation, écrans Assistant IA, flux parcours 9–12. Applique les règles métier IA du PLAN.md §1.6. »_

### Phase 13 — Paramètres, états, polish, accessibilité, perf

- **Périmètre** : Paramètres (profil, préférences, sécurité, catégories, import/export, sauvegarde/restauration, **Paramètres IA** : activer/désactiver suggestions, types d'alertes, fréquence des résumés, usage des données, historique des recommandations) ; persistance des filtres ; retours de navigation ; parité dark mode ; responsive 390↔1440 complet ; **a11y** (focus, contrastes, clavier, ARIA) ; perf (lazy-load des modules lourds).
- **DoD / fidélité** : tous les écrans existent en clair+sombre et aux deux largeurs ; états vide/succès/erreur partout.

### Phase 14 — Tests, fidélité globale, livraison

- **Périmètre** : e2e Playwright des **12 parcours** ; suite complète de **régression visuelle** (les 8 captures, clair+sombre, 390+1440) ; couverture unités sur `money()`, calculs d'amortissement/simulation, agrégations dashboard ; CI verte ; build prod ; déploiement (**front** Vercel/Netlify + **backend Hono** Vercel/Fly/Cloudflare + **Turso**) ; doc d'install.
- **DoD / fidélité** : 100 % des parcours passent ; toute la suite visuelle au vert sous le seuil de tolérance.

---

## 5. Ordre des dépendances & jalons

```
P0 ─ P1 ─ P2
        └─ P3 ─ P4 ─┬─ P5 ─ P6
                    ├─ P7
                    ├─ P8
                    ├─ P9
                    ├─ P10 ─ P11
                    └──────────── P12 (IA, après P4–P11)
P5..P12 ─ P13 ─ P14
```

- **Jalon A (fin P1)** : design system + shell pixel-fidèles. _Premier vrai test de fidélité._
- **Jalon B (fin P4)** : dashboard vivant sur données réelles.
- **Jalon C (fin P11)** : tous les modules « métier » fonctionnels.
- **Jalon D (fin P12)** : IA branchée, règles respectées.
- **Jalon E (fin P14)** : app testée, fidèle, déployée.

P7/P8/P9/P10 sont **parallélisables** (worktrees) une fois P4 livré.

---

## 6. Garde-fous de fidélité — checklist permanente

À cocher à chaque fin de phase (via `/revue-fidelite`) :

- [ ] Couleurs = `tokens.css` (aucune couleur en dur ailleurs).
- [ ] Chiffres en **mono**, montants via `money()` (espaces fines `\u202f`), suffixe `FCFA`.
- [ ] Rendu conforme au composant source `.jsx` (et cohérent avec la capture desktop quand elle existe), en clair **et** sombre, 390 **et** 1440 ; baseline de régression auto-générée.
- [ ] Primitives de graphes maison (pas de lib qui change le rendu).
- [ ] États vide / succès / erreur présents.
- [ ] Navigation : `vue → filtre → détail → action → retour` ; filtres persistants ; liens transverses fonctionnels.
- [ ] Domaine ivoirien respecté (comptes, vendeurs, FCFA).
- [ ] (IA) suggestion confirmable/corrigeable/ignorable ; prévision avec horizon+confiance ; aucune action financière auto.

---

## 7. Pour démarrer dès maintenant (1ʳᵉ session Claude Code)

1. `cd` dans un dossier vide, place ce `PLAN.md` à la racine.
2. Lance Claude Code, passe en **Plan Mode** (`Shift+Tab` ×2).
3. Colle le **prompt de la Phase 0**.
4. Valide le plan proposé, laisse exécuter.
5. Fais relire le diff par un sous-agent (`/code-review`) avant de committer.
6. Phase suivante.

> Réf. produit Claude Code (vérifier la version courante) : `docs.claude.com/en/docs/claude-code/overview`.
