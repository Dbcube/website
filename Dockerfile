# syntax=docker/dockerfile:1
# ============================================================
# Dbcube website (my-docs) — RUNTIME-ONLY image.
#
# The Nuxt build runs on the HOST (scripts/release.sh: `bun run build`), which is
# far faster than building inside Docker Desktop. This image just ships the
# prebuilt `.output/` and runs it with Node. Build `.output/` first:
#     bun install && bun run build
# ============================================================
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# Prebuilt Nuxt/Nitro output (server + public). Produced on the host.
COPY .output ./.output

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", ".output/server/index.mjs"]
