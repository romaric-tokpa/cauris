# Plan de développement — Cauris **v2** (finances personnelles augmentées + coach IA)

> **Évolution du plan v1.** Le socle de tracking (Phases 0–13) est **conservé intégralement** — c'est la fondation, rien n'est supprimé. La v2 ajoute trois choses : (A) les **écrans/formulaires** que le wireframe v2 fournit désormais (et qui étaient des `.soon`), (B) une **couche de capture multi-canal**, (C) une **couche de coaching IA**. Source : cahier des charges v2 + `design/wireframe/` (nouveaux `.jsx`).
> Le plan v1 reste consultable (`PLAN-DEV-CAURIS-v1-backup.md`). Le `CLAUDE.md` et les principes (fidélité absolue, scoping `user_id`, money()/`\u202f`, fait dérivé ≠ inventé, IA suggestion-only, prouver-pas-affirmer) restent **inchangés et s'appliquent à toute la v2**.

---

## 0. Vision v2 (rappel du cahier des charges)

Produit à **trois couches complémentaires**, le coach par-dessus le tracking, jamais à sa place :
1. **Socle de tracking** (comptes, transactions, budgets, objectifs, dette, analytics, récurrences) — *fait, Phases 0–13*.
2. **Capture multi-canal** (saisie rapide, vocale, conversationnelle, mobile money + cash/enveloppes, SMS Android optionnel).
3. **Coaching IA** (mémoire financière, verdicts argumentés, prévisions, recommandations, dégradation gracieuse).

Posture du coach : **franc, factuel, non moralisateur** ; peut dire non, mais **rare, argumenté, basé sur données + confiance élevée**. **Aucune action financière sans validation explicite.**

---

## 1. État à date (début v2)

- Socle complet : 10 écrans vivants (dashboard, transactions, budgets, objectifs, comptes, prêt, analytics, notifications, assistant, paramètres) + auth/onboarding.
- Données **dérivées live** (façade `getMonthlySummary`/`getCategoryBreakdown`), scoping `user_id` prouvé partout, masquage serveur des comptes bloqués.
- Couche IA **en stub déterministe** (frontière unique `askClaude`, prête à basculer sur l'API Anthropic), suggestion-only, §1.6 respecté.
- **Audit d'interaction fait** : tous les boutons morts corrigés ; les actions non encore implémentées sont en **désactivé honnête** (`disabled + .soon + title`) — ce sont précisément celles que le **Lot A** va rendre réelles.
- Tests : `check` (lint+types+unités) + e2e (fidélité + **interaction** + **post-nav** + garde FAB).
- Dette connue : code-splitting retiré (course de clic) — chantier futur ; CI bloquée (facturation) — gate = pre-commit local ; bascule IA stub→réel — à la livraison.

---

## 2. Décisions de cadrage v2 (à valider/figées)

- **A — Lot prioritaire : les CRUD/actions/settings d'abord** (rend l'app pleinement utilisable). ✅ validé.
- **Vocale + SMS Android = UI complète + STUB** (transcription/lecture simulées, flux réel de bout en bout ; vraie intégration audio/SMS = chantier ultérieur). *(à confirmer)*
- **Coach = moteur déterministe + LLM de reformulation** : verdicts et chiffres **calculés par règles** sur les données réelles ; le LLM (frontière `askClaude`) ne fait que **reformuler**. *(à confirmer)*
- **IA globale en stub jusqu'à la livraison** (zéro coût) ; bascule API Anthropic = une décision + une clé, en fin de parcours. *(à confirmer)*

---

## 3. Les lots v2

Chaque lot = des sous-blocs, **STOP après le bloc API** (ou après le plan si front pur), **prouver par grep/curl/SQL**, fidélité jugée sur le `.jsx` source.

### LOT A — Écrans & formulaires wireframés *(transforme les `.soon` en réel)*

Source : `screens-crud-desk.jsx`, `screens-crud-mob.jsx`, `screens-analytics-actions.jsx`, `screens-settings-pages.jsx`, `screens-settings-mob.jsx`.

**A1 — CRUD Transactions/Transferts** *(le plus utilisé)*
- Le drawer d'ajout existe déjà (Phase 5). Ajouter : **transfert interne** (depuis/vers + soldes après) et **transfert récurrent** (fréquence) ; **édition** complète ; **récurrences** (« Nouvelle récurrence » : libellé/montant/fréquence/prochaine/statut confirmée|à confirmer + détection auto affichée).
- API : étendre POST/PATCH transactions pour le transfert (transfer_account_id, validation possédé≠source) ; CRUD recurrences scopé. Tout vérifié appartenance (→404).

**A2 — CRUD Budgets** : « Nouveau budget » (catégorie, plafond, période Hebdo/Mensuel/Annuel, alerte à %, report du solde non dépensé), édition/ajuster plafond, archiver/réactiver. API POST/PATCH/archive budgets scopé.

**A3 — CRUD Objectifs** : « Nouvel objectif » (nom, montant cible, **date cible** → lève la dette onboarding, priorité), édition. La contribution existe déjà (Phase 7). API POST/PATCH goals scopé.

**A4 — CRUD Comptes** : « Ajouter un compte » (nom, type bancaire/épargne/cash/mobile money, solde initial), édition, **blocage/déblocage** (cohérent avec le masquage serveur). API POST/PATCH/block accounts scopé.

**A5 — Actions Analytics** : **export de rapport** (format, période couverte, sections à inclure, langue) et **sélecteur de période** (mini-calendrier de plage `.cal` + périodes rapides). L'export : générer un fichier réel (PDF/CSV) côté client ou via route — à cadrer. La période : filtre réel propagé aux vues.

**A6 — Sous-pages Paramètres** : Profil (édition nom via `updateUser`), Préférences, Sécurité (changement mdp déjà fait), **Catégories** (CRUD catégories : nouvelle/éditer/supprimer), Import/Export, **Sauvegarde** (« Sauvegarder maintenant »), Centre d'aide (FAQ accordéon `.faq-row`). Porter ce qui est réellement actionnable ; le reste en `.soon` honnête.

**DoD Lot A** : tous les `.soon` du tableau d'audit deviennent **réels** (ou restent honnêtement désactivés si vraiment hors périmètre) ; chaque écriture scopée + appartenance vérifiée ; **tests d'interaction** (le bouton agit → effet) pour chaque nouveau formulaire ; baselines stables/régénérées délibérément ; agrégats dérivés cohérents (un budget/compte/transaction créé se répercute partout).

### LOT B — Capture multi-canal

Source : `screens-capture.jsx`. **UI réelle + stub** pour audio/SMS.

- **B1 — Saisie rapide** : formulaire minimal (montant, type, **canal** cash/Wave/Orange Money/banque, compte source, catégorie, date auto, note) → « Enregistrer en 1 geste ». Crée une vraie transaction (API existante). Le **canal** devient un attribut de transaction (migration : `transactions.channel`).
- **B2 — Note vocale** : UI (enregistrement, transcription en direct, champs extraits, vérifier/corriger/valider). **Stub** : transcription + extraction simulées déterministes (« Wave 3 500 déjeuner » → fiche pré-remplie). Frontière unique pour brancher un vrai STT plus tard. Validation = crée une transaction réelle.
- **B3 — Saisie conversationnelle** : langage naturel texte → extraction (réutilise la frontière IA `askClaude` mode extraction, stub). Validation explicite.
- **B4 — Cash & enveloppes** : suivi par enveloppe (budget, reste, date de réconciliation) — modèle `envelopes` scopé. Réconciliation périodique.
- **B5 — SMS Android** : **UI + stub** (proposition de transaction « auto-capturé » à valider). Optionnel par design (l'app fonctionne sans). Pas d'intégration native maintenant.

**DoD Lot B** : chaque mode crée une **vraie transaction validée** (jamais sans validation) ; canal modélisé et visible en analytics (flux par canal) ; audio/SMS clairement étiquetés « simulé » derrière une frontière unique.

### LOT C — Coach IA

Source : `screens-coach.jsx`. **Moteur déterministe + reformulation LLM**, sur la frontière `askClaude`.

- **C1 — Moteur de verdict déterministe** (`src/lib/coach*.ts`, pur, testé) : à partir des données réelles, calcule un **type d'avis** (OK / OK sous conditions / risqué / déconseillé / incohérent) selon les questions du cahier (compromet un objectif ? dégrade une situation fragile ? inhabituel vs historique ? schéma défavorable ? alternative ? finançable sans tension ?). Sortie : verdict + **3–5 points factuels** + options alternatives. **Tests unitaires** comme `loanSim`.
- **C2 — Score de complétude + dégradation gracieuse** : calcule un score de complétude des données ; sous un seuil → « analyse partielle / confiance faible », et le coach **refuse de conclure solidement** (cf. wireframe « Je ne peux pas conclure… »). Affiche maturité du coach.
- **C3 — Réponse « 4 couches »** : verdict (déterministe) → transparence (données utilisées) → options → reformulation langage clair (LLM). Niveau de confiance (high/med/low) affiché. Niveau d'intervention calibré (contradiction rare).
- **C4 — Écran Coach** porté 1:1 (remplace/étend l'assistant actuel) : question → réponse en couches, complétude, recommandations reliées à un objectif concret, suggestions d'actions de fiabilisation (« réconcilier le cash », « déclarer une charge fixe »).
- **C5 — Mémoire financière** : ~~persister habitudes/recommandations passées/réponses (suivies|ignorées)~~. **DIFFÉRÉ délibérément (post-livraison)** : pas d'UI wireframée + valeur conditionnée à un usage réel ; à designer si le besoin émerge. La **mémoire passive** (récurrences, historique 6 mois, objectifs) est **déjà consommée** par le coach via `/api/coach/context`.

**DoD Lot C** : verdicts **déterministes et testés** (le LLM ne fait que reformuler, n'invente aucun chiffre/verdict) ; §1.6 + posture (franc, non moralisateur, contradiction rare argumentée) ; dégradation gracieuse réelle (confiance faible quand données manquent) ; suggestion-only.

### LOT D — Livraison

**Registre des BASCULES stub → réel** (chaque bascule est isolée, documentée à son point d'usage) :
1. **`askClaude` (`server/ai.ts`)** → vrai LLM Anthropic (clé **serveur**) : reformulation du coach (C3), chat (`/api/ai/chat`), insights, budget-advice, goal-projection, forecasts, anomalies. Le moteur déterministe reste le **garant** (le LLM ne fait que reformuler).
2. **Routage du chat (`src/lib/coachChat.ts`)** → mapping LLM question→intention (survive / afford+montant / data / unknown). Aujourd'hui regex fermées ; demain le LLM classe l'intention, **le moteur décide toujours les chiffres**. L'aveu honnête « je ne sais pas encore » reste le repli.
3. **`COACH_TODAY` (`src/lib/coachAssembly.ts`)** → vraie date (`now()`) — **1 ligne** (les tests injectent déjà `today` en paramètre).
4. **`simulateTranscription` (`src/lib/voiceStub.ts`)** → vrai speech-to-text (note vocale B2).
5. **`SIMULATED_SMS` (`src/lib/voiceStub.ts`)** → vraie passerelle SMS Android (B5).

- **Décision stub → vraie API Anthropic** (clé, bascule `askClaude` + STT + extraction, validation des champs `icon`/format, budget tokens).
- Tests e2e des parcours v2 (capture texte/voix, comprendre son mois, anticiper fin de mois, objectif, échéance dette, **demander l'avis du coach**, réconcilier cash).
- Build prod, déploiement (front + Hono + Turso), doc, API d'exposition (Personal OS — cf. cahier, si retenu).

---

## 4. Ordre recommandé & dépendances

```
[Socle 0–13 ✅] → LOT A (A1→A6) → LOT B (B1→B5) → LOT C (C1→C5) → LOT D
```
- **A d'abord** (validé) : rend l'app pleinement utilisable, transforme tous les `.soon`.
- **B ensuite** : la capture s'appuie sur les transactions/comptes (CRUD de A).
- **C en dernier** (hors livraison) : le coach exploite tracking + capture ; c'est la couche la plus profonde, à faire frais.
- Migrations attendues : `transactions.channel` (B1), `envelopes` (B4), mémoire coach (C5). Toujours : entiers FCFA, scoping `user_id`, assertions de cohérence, re-seed vert.

---

## 5. Garde-fous v2 (en plus des principes v1)

- [ ] **Anti-bouton-mort** : tout nouveau contrôle AGIT, est DÉSACTIVÉ HONNÊTE, ou se justifie — jamais cliquable-sans-effet. Test d'interaction pour chaque action.
- [ ] **Tests d'interaction** (pas seulement de rendu) : chaque parcours clé a un test qui clique → vérifie l'effet (l'angle mort qui a coûté cher).
- [ ] **Capture** : aucune transaction créée sans **validation explicite** ; audio/SMS = stub étiqueté.
- [ ] **Coach** : verdict **déterministe** (calculé, testé) ; LLM = reformulation seule ; dégradation gracieuse ; non moralisateur ; contradiction rare + argumentée.
- [ ] **Fidélité** : porter depuis les `.jsx` v2 ; ne pas inventer ce qu'ils ne montrent pas ; ne pas mentir (sécurité/confidentialité/éditabilité).
- [ ] **Cohérence dérivée** : toute création (compte/budget/transaction/enveloppe) se répercute dans les agrégats (façade), sans seconde source de vérité.
- [ ] **Prouver, pas affirmer** : grep d'étanchéité, curl scoping/404/401, assertions seed, et **test à l'écran** (pas seulement e2e vert).

---

## 6. Pour démarrer le Lot A

Sous-bloc **A1** (CRUD Transactions/Transferts) en premier — le plus utilisé, et il étend un drawer déjà existant. Plan Mode → vérifier `screens-crud-desk/mob.jsx` → STOP après le bloc API (transferts + récurrences scopés) avant le front.
