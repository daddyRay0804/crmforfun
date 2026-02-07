# apps/api/Dockerfile
# Production image for @bet-crm/api (NestJS)

FROM node:22-slim AS build
WORKDIR /app

# 1) Install deps (workspaces)
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/admin/package.json ./apps/admin/package.json
RUN npm ci

# 2) Build API
COPY . .
RUN npm -w apps/api run build

# --- Runtime ---
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# copy only what we need to run
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api ./apps/api

WORKDIR /app/apps/api
EXPOSE 3001

# Run DB migrations on startup (idempotent), then start API.
CMD ["bash", "-lc", "npm -w apps/api run migrate:up && node dist/main.js"]
