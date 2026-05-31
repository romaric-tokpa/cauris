---
description: Compare le rendu au composant source .jsx (source de vérité) + checklist de fidélité (PLAN §6)
argument-hint: [NomEcran] (optionnel — sinon l'écran en cours de travail)
---

Fais une **revue de fidélité** de l'écran $ARGUMENTS (ou de l'écran en cours si non précisé), en contexte neuf.

## Sources

- **Source de vérité : `design/wireframe/*.jsx`** (lecture seule) — le composant d'origine de l'écran (`wf-lib.jsx`, `shell.jsx`, `screens-*.jsx`, `dashboard-*.jsx`). C'est lui qu'on doit reproduire.
- `PLAN-DEV-CAURIS.md` §6 (checklist) et §1.2/§1.3 (tokens & formatage).
- `CLAUDE.md` (règles de rendu / formatage / domaine / navigation, section « Fidélité au wireframe »).
- `design/wireframe/screenshots/` — **sanity visuelle desktop UNIQUEMENT** (fond canvas/scroll/overlays, pas de mobile, bug d'échappement) : utile pour un coup d'œil, **jamais** comme baseline pixel.

## Méthode

1. Ouvre le **composant source `.jsx`** correspondant à $ARGUMENTS et compare-le, élément par élément, au rendu actuel (structure, libellés, ordre, primitives, tons). C'est la comparaison qui fait foi.
2. Utilise la capture **desktop** de `screenshots/` comme simple sanity (jamais comme vérité pixel ; aucune capture mobile n'existe).
3. Déroule la **checklist §6 du PLAN** et signale chaque point :
   - [ ] Couleurs = `tokens.css` (aucune couleur en dur).
   - [ ] Chiffres en **mono**, montants via `money()` (espaces fines ` ` / ` `), suffixe `FCFA`.
   - [ ] Rendu conforme au composant source `.jsx`, en clair **et** sombre, 390 **et** 1440.
   - [ ] Primitives de graphes maison (pas de lib).
   - [ ] États vide / succès / erreur présents.
   - [ ] Navigation : `vue → filtre → détail → action → retour` ; filtres persistants ; liens transverses fonctionnels.
   - [ ] Domaine ivoirien respecté (comptes, vendeurs, FCFA).
   - [ ] (IA) suggestion confirmable/corrigeable/ignorable ; prévision avec horizon + confiance ; aucune action financière auto.

## Sortie attendue

- Une **liste d'écarts** précise (fichier:ligne quand pertinent), classés par gravité.
- Pour chaque écart : attendu (réf. `.jsx` / token) vs rendu, et le correctif proposé.
- Conclusion : **PASS** ou **FAIL**, puis la prochaine action (corriger, puis `/snapshot` pour figer la baseline de régression).
