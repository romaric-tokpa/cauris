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

## Régression visuelle = gate LOCAL, PAS la CI

Les baselines pixel sont **spécifiques à l'OS** (suffixe `-darwin` = macOS) : le
rendu sub-pixel des polices/anti-aliasing diffère d'un OS à l'autre, donc les
comparer sur un runner **Linux** produirait des **faux positifs**. Décision :

- **La CI NE fait PAS de régression visuelle.** Le job e2e GitHub Actions lance
  `npm run e2e:ci` → **uniquement les tests FONCTIONNELS** (projet `smoke` :
  l'app monte + parcours). Il garantit lint + types + build + e2e fonctionnel.
- **La fidélité visuelle est un gate LOCAL**, sous la responsabilité du dev
  **avant de pousser** : lancer `npm run e2e` (tout, dont le projet `fidelity`)
  et vérifier le snapshot de l'écran touché.

Scripts :

| Commande | Portée | Où |
| --- | --- | --- |
| `npm run e2e:ci` | fonctionnels seulement (`--project=smoke`) | CI **et** local |
| `npm run e2e` | tout (fonctionnels **+** fidelity pixel) | **local** uniquement |

> On **ne génère pas** de baselines Linux et on **ne supprime pas** les
> baselines `-darwin` : elles restent la référence du gate local.
- Ne jamais lancer `--update-snapshots` sur `design/wireframe/screenshots/`
  (captures d'intention desktop, intouchables).

## Isolation du harnais — lire avant de (re)générer

Le harnais e2e gère **son propre serveur + sa propre DB**, totalement isolés du dev :

- **Ports dédiés** : front `5273`, backend `8887` (jamais le dev `5173`/`8787`).
  `reuseExistingServer: false` → Playwright **ne réutilise jamais** un `npm run dev`
  manuel (qui peut servir un module périmé par HMR et fausser les pixels).
- **DB jetable** : `file:e2e-local.db` (gitignored), **re-créée à neuf** à chaque
  run — la commande du serveur de test fait `rm + db:migrate + db:seed` **avant**
  de booter. La DB de dev (`local.db`) n'est **jamais** touchée, et inversement.
- **Conséquence** : `npm run e2e` repart **propre et déterministe même si un
  `npm run dev` tourne en parallèle** (ports et fichiers DB disjoints).

> ⚠️ **Ne jamais régénérer une baseline en s'appuyant sur un `npm run dev`.** Le
> harnais e2e gère son propre serveur + seed ; il suffit de lancer
> `npm run e2e -- --project=fidelity` (ou `--update-snapshots` pour régénérer).
> Un dev manuel n'influence plus le résultat — mais ne contourne pas le harnais
> en pointant Playwright sur le dev : tu réintroduirais la pollution/le périmé
> que cette isolation supprime.

> Pourquoi pas un `globalSetup` ? En Playwright le `webServer` démarre **avant**
> le `globalSetup` ; remettre la DB à zéro en `globalSetup` entrerait en course
> avec le serveur déjà lancé (inode SQLite remplacé sous ses pieds). On séquence
> donc `rm + migrate + seed` **dans la commande serveur** — ordre garanti.
