# Déploiement Cauris — checklist (Lot D1)

Cible : **front Vite → Vercel**, **backend Hono → Fly.io**, **DB → Turso (libSQL)**.
Architecture réseau **option A** : Vercel reverse-proxifie `/api/*` vers Fly → le navigateur
voit du **same-origin**, le cookie de session Better Auth reste **first-party**, **aucun CORS**.

```
  navigateur ──► https://<app>.vercel.app ──(rewrite /api/*)──► https://cauris-api.fly.dev ──► Turso
       (front statique Vite)                                      (Hono + Better Auth)      (libSQL)
```

> Prérequis : `flyctl` (`brew install flyctl`), `turso` CLI, `vercel` CLI, comptes créés.
> Les valeurs entre `<...>` sont à remplacer. **Aucun secret ne va dans le repo.**

---

## 0. Secrets — générer une fois

```bash
openssl rand -hex 32        # → BETTER_AUTH_SECRET
```

Inventaire complet des variables (cf. `.env.example`) :

| Variable | Où | Valeur prod |
|---|---|---|
| `TURSO_DATABASE_URL` | Fly secret + machine de migration | `libsql://<db>.turso.io` |
| `TURSO_AUTH_TOKEN` | Fly secret + machine de migration | token Turso |
| `BETTER_AUTH_SECRET` | Fly secret | `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | Fly secret | **l'URL publique Vercel** (front), pas l'URL Fly |
| `AUTH_TRUSTED_ORIGINS` | Fly secret | l'URL publique Vercel (csv si plusieurs) |
| `NODE_ENV` / `PORT` | `fly.toml [env]` | `production` / `8787` (déjà posés) |
| `ANTHROPIC_API_KEY` | — | **non requis en D1** (IA en stub) |
| `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` | local, à la demande | seed démo optionnel |

> `BETTER_AUTH_URL` = l'URL **vue par le navigateur** (Vercel), parce que le cookie de
> session est posé sur cette origine via le rewrite. Ne pas y mettre l'URL Fly.

---

## 1. Turso (base de données cloud)

```bash
turso db create cauris
turso db show cauris --url                 # → TURSO_DATABASE_URL
turso db tokens create cauris              # → TURSO_AUTH_TOKEN
```

Appliquer le schéma (les migrations `server/db/migrations/*` sont rejouées par Fly à chaque
déploiement, mais on initialise la DB une première fois ici) :

```bash
TURSO_DATABASE_URL="libsql://<db>.turso.io" \
TURSO_AUTH_TOKEN="<token>" \
npm run db:migrate
```

---

## 2. Fly.io (backend Hono)

`Dockerfile` + `fly.toml` sont au racine. **Éditer `fly.toml`** : `app` (nom unique) et
`primary_region` (`cdg` = Paris, latence correcte vers la CI).

```bash
fly launch --no-deploy --copy-config        # réutilise fly.toml ; refuser DB/Redis proposés
fly secrets set \
  TURSO_DATABASE_URL="libsql://<db>.turso.io" \
  TURSO_AUTH_TOKEN="<token>" \
  BETTER_AUTH_SECRET="<hex32>" \
  BETTER_AUTH_URL="https://<app>.vercel.app" \
  AUTH_TRUSTED_ORIGINS="https://<app>.vercel.app"
fly deploy                                   # build l'image, joue `release_command` (db:migrate), démarre
fly logs                                      # vérifier « Hono prêt sur ... »
```

> `release_command = "npm run db:migrate"` (dans `fly.toml`) rejoue les migrations à chaque
> déploiement, avant de router le trafic. Noter l'URL : `https://<app>.fly.dev`.

---

## 3. Vercel (front Vite)

`vercel.json` est au racine. **Remplacer l'URL Fly** dans la 1ʳᵉ règle `rewrites`
(`https://cauris-api.fly.dev/api/:path*` → ton vrai `https://<app>.fly.dev/api/:path*`).

```bash
vercel link
vercel deploy --prod
```

Aucune variable d'env Vercel requise : le client appelle `/api/*` en **relatif**, le rewrite
fait le reste. (Pas de `VITE_API_URL` — c'est tout l'intérêt de l'option A.)

---

## 4. DNS / CORS final

- Brancher le domaine custom sur **Vercel** (front = porte d'entrée).
- Mettre à jour les secrets Fly avec l'URL finale puis redéployer la config :
  ```bash
  fly secrets set BETTER_AUTH_URL="https://<domaine>" AUTH_TRUSTED_ORIGINS="https://<domaine>"
  ```
- Mettre à jour la destination du rewrite dans `vercel.json` si l'URL Fly a changé, puis
  `vercel deploy --prod`.
- **CORS** : rien à configurer côté Hono tant qu'on reste en option A (same-origin via rewrite).
  *Bascule éventuelle vers du vrai cross-origin (option B) : ajouter `hono/cors`
  (`origin` = URL front, `credentials: true`) **et** passer le cookie Better Auth en
  `SameSite=None; Secure`. Non retenu en D1.*

---

## 5. Seed démo (optionnel, jamais automatique)

Le serveur **ne seed jamais** au démarrage. Pour (re)créer le compte de démo **Aïcha**
(données gelées mai 2026) contre la DB cloud, commande **explicite** :

```bash
TURSO_DATABASE_URL="libsql://<db>.turso.io" \
TURSO_AUTH_TOKEN="<token>" \
SEED_USER_EMAIL="aicha@cauris.demo" \
SEED_USER_PASSWORD="<motdepasse>" \
npm run db:seed
```

> Rappel honnêteté : avec la **date réelle** (bascule Lot D), le coach d'Aïcha signalera
> « données anciennes / confiance dégradée » — c'est attendu pour un compte démo gelé.

---

## Vérifs de bonne santé

```bash
curl -i https://<app>.fly.dev/api/health        # backend direct → {"status":"ok"}
curl -i https://<app>.vercel.app/api/health      # via le rewrite Vercel → idem (prouve l'option A)
# Sign-up → onboarding → dashboard : le cookie de session doit persister (same-origin via rewrite).
```

## Ce qui reste en STUB après D1 (non bloquant)

`askClaude` (IA) · transcription vocale (STT) · réception SMS · **dates démo gelées hors
coach** (transactions/analytics/notifs pointent mai-juin 2026). Voir le registre des bascules
dans `PLAN-DEV-CAURIS-V2.md`.
