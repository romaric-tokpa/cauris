---
description: Compare l'écran courant à sa capture de référence et déroule la checklist de fidélité (PLAN §6)
argument-hint: [NomEcran] (optionnel — sinon l'écran en cours de travail)
---

Fais une **revue de fidélité** de l'écran $ARGUMENTS (ou de l'écran en cours si non précisé), en contexte neuf.

## Sources

- `PLAN-DEV-CAURIS.md` §6 (checklist permanente) et §1.2/§1.3 (tokens & formatage).
- `CLAUDE.md` (règles de rendu / formatage / domaine / navigation).
- `design/wireframe/screenshots/` — capture(s) de référence correspondant à l'écran.

## Méthode

1. Identifie la **capture de référence** pertinente dans `design/wireframe/screenshots/` (ex. `full.png`/`dark.png` pour le Dashboard, `budget-detail.png`, `obj-desk.png`, `ana-desk.png`, `pret-sim.png`…). Compare le rendu actuel à cette capture, en **clair et sombre**, **390 et 1440**.
2. Déroule la **checklist §6 du PLAN** et coche / signale chaque point :
   - [ ] Couleurs = `tokens.css` (aucune couleur en dur).
   - [ ] Chiffres en **mono**, montants via `money()` (espaces fines ` `), suffixe `FCFA`.
   - [ ] Conforme à la capture (clair **et** sombre, 390 **et** 1440).
   - [ ] Primitives de graphes maison (pas de lib).
   - [ ] États vide / succès / erreur présents.
   - [ ] Navigation : `vue → filtre → détail → action → retour` ; filtres persistants ; liens transverses fonctionnels.
   - [ ] Domaine ivoirien respecté (comptes, vendeurs, FCFA).
   - [ ] (IA) suggestion confirmable/corrigeable/ignorable ; prévision avec horizon + confiance ; aucune action financière auto.

## Sortie attendue

- Une **liste d'écarts** précise (fichier:ligne quand pertinent), classés par gravité.
- Pour chaque écart : ce qui est attendu (réf. wireframe / token) vs ce qui est rendu, et le correctif proposé.
- Conclusion : **PASS** ou **FAIL** du gate de fidélité, et la prochaine action (corriger, puis `/snapshot`).
