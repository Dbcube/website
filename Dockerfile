# syntax=docker/dockerfile:1
# ============================================================
# Dbcube website (my-docs) — Nuxt SSR served by Bun.
#
# SSR (not static) so EVERY route renders reliably: docs, the dynamic blog,
# content pages, etc. The home's Three.js scene and the Mermaid diagrams still
# render client-side. Build and runtime share the Bun base image so native
# deps (better-sqlite3) keep the same ABI.
# ============================================================

# ---- build stage ----------------------------------------------------------
FROM oven/bun:1 AS build
WORKDIR /app

# Toolchain for native deps (better-sqlite3 builds at install time)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
ENV NODE_ENV=production
RUN bun run build               # → .output/ (server + public)

# ---- runtime stage --------------------------------------------------------
# Run the Nitro output with Node (the verified runtime for this .output). The
# build still uses Bun above so native deps share the same toolchain.
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
COPY --from=build /app/.output ./.output
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", ".output/server/index.mjs"]
