# Cauris — image du backend Hono (déployée sur Fly.io).
# Le serveur tourne via `tsx` (TS exécuté au runtime, comme en dev) — pas d'étape de
# build serveur. drizzle-kit reste présent pour le `release_command` (migrations Turso).
# Le front (Vite) n'est PAS dans cette image : il est servi par Vercel (cf. vercel.json).
FROM node:20-alpine

WORKDIR /app

# Dépendances d'abord (cache de couche). On installe TOUT (tsx + drizzle-kit sont en
# devDependencies et sont requis en prod ici : tsx lance le serveur, drizzle-kit migre).
COPY package.json package-lock.json ./
RUN npm ci

# Source nécessaire au runtime : serveur, schéma/migrations Drizzle, config.
COPY server ./server
COPY drizzle.config.ts ./
COPY tsconfig.json tsconfig.server.json ./

ENV NODE_ENV=production
# Fly route le trafic public vers ce port (cf. fly.toml [http_service].internal_port).
ENV PORT=8787
EXPOSE 8787

# `process.env.PORT` est déjà lu par server/index.ts.
CMD ["npx", "tsx", "server/index.ts"]
