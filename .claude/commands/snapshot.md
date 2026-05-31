---
description: (Re)génère/valide le snapshot Playwright de l'écran courant (clair+sombre, 390+1440)
argument-hint: [NomEcran] (optionnel)
---

(Re)génère ou valide le **snapshot de régression visuelle** Playwright de l'écran $ARGUMENTS (ou l'écran courant).

## Sources & outillage

- `PLAN-DEV-CAURIS.md` §3.3 (gate de fidélité visuelle) et §6 (checklist).
- `CLAUDE.md` (« un écran n'est fini qu'après passage du snapshot »).
- `playwright.config.ts` (projet **fidelity**, seuil serré) et `e2e/helpers/visual.ts` (`expectFidelity`, `THEMES`, `WIDTHS`, `applyTheme`).
- Références : `design/wireframe/screenshots/` (montées via `snapshotPathTemplate`). **Ne jamais lancer `--update-snapshots` sur le projet fidelity** (ce sont les références figées).

## Méthode

1. Écris/complète la spec `e2e/<ecran>.fidelity.ts` qui appelle `expectFidelity(page, url, variants)` avec, pour chaque variante, la **capture de référence** correspondante, en **clair ET sombre**, **390 ET 1440** (`WIDTHS.mobile` / `WIDTHS.desktop`).
2. Lance le gate :
   - validation : `npm run e2e -- --project=fidelity`
   - (génération de nos propres baselines hors références wireframe : `--update-snapshots`, jamais sur les références figées du projet fidelity).
3. Vérifie le passage **sous le seuil de tolérance** (cf. `VISUAL_THRESHOLD`). En cas d'échec, ouvre le diff, corrige le rendu (pas la référence) puis relance.

## Sortie attendue

- Le snapshot passe en clair + sombre, 390 + 1440, sous le seuil.
- Si échec : liste des variantes en écart + cause probable (token, police mono, espacement…) et correctif.
- Rappel : ne pas considérer l'écran « fini » tant que le snapshot n'est pas vert (CLAUDE.md).
