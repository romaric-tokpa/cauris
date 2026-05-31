---
description: (Re)génère/valide la baseline de régression dans e2e/baselines/ (clair+sombre, 390+1440)
argument-hint: [NomEcran] (optionnel)
---

(Re)génère ou valide la **baseline de régression visuelle** de l'écran $ARGUMENTS (ou l'écran courant), stockée dans `e2e/baselines/`.

## Sources & outillage

- `PLAN-DEV-CAURIS.md` §3.3 (gate visuel) et §6 (checklist).
- `CLAUDE.md` (« un écran est fini après `/revue-fidelite` PASS **et** baseline de régression auto-générée »).
- `playwright.config.ts` (projet **fidelity**, `snapshotPathTemplate` → `e2e/baselines/{arg}-{platform}{ext}`, seuil serré).
- `e2e/helpers/visual.ts` (`expectFidelity`, `THEMES`, `WIDTHS`, `applyTheme`).

## Règle d'or

Les baselines sont **auto-générées** dans `e2e/baselines/` et **versionnées**.
**Ne jamais** lancer `--update-snapshots` contre `design/wireframe/screenshots/` :
ce sont des captures d'intention desktop, pas des baselines.

## Méthode

1. Écris/complète la spec `e2e/<ecran>.fidelity.ts` :
   `await expectFidelity(page, '<ecran>', '<url>')` — couvre automatiquement clair+sombre × 390+1440.
2. Génère la baseline au premier passage validé :
   `npm run e2e -- --project=fidelity --update-snapshots`
   (Playwright écrit les PNG dans `e2e/baselines/`. Relis-les avant de committer.)
3. Valide ensuite (sans update) : `npm run e2e -- --project=fidelity`.
4. En cas d'échec ultérieur : ouvre le diff, corrige le **rendu** (pas la baseline), puis relance. Ne régénère la baseline que si le changement de rendu est **intentionnel et validé**.

## Sortie attendue

- Baselines présentes pour les 4 variantes (clair/sombre × 390/1440), gate vert sous le seuil.
- Si échec : variantes en écart + cause probable (token, police mono, espacement…) et correctif.
- Rappel : écran non « fini » tant que `/revue-fidelite` n'est pas PASS et la baseline pas verte.
