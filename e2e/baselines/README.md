# Baselines de régression visuelle

Snapshots Playwright **auto-générés** (projet `fidelity`), pour chaque écran en
thème **clair + sombre** × largeurs **390 + 1440**. Ils détectent les **dérives
de rendu** entre deux exécutions.

- Générés/validés via `/snapshot` ou `npm run e2e -- --project=fidelity`.
- **Versionnés** (ils sont la référence de régression) ; suffixés par plateforme
  (`-darwin`, `-linux`…) pour éviter les faux positifs dev ↔ CI.
- Ce ne sont **PAS** des références de fidélité au wireframe. La fidélité se
  vérifie par revue humaine du rendu vs le composant source
  `design/wireframe/*.jsx` (cf. `/revue-fidelite` et CLAUDE.md).
- Ne jamais lancer `--update-snapshots` sur `design/wireframe/screenshots/`
  (captures d'intention desktop, intouchables).

> Vide pour l'instant : aucune baseline sur `TokenDemo` (composant jetable,
> supprimé en Phase 1).
