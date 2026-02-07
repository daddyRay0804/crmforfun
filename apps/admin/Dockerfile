# apps/admin/Dockerfile
# Production image for @bet-crm/admin (Next.js)

FROM node:22-slim AS build
WORKDIR /app

# 1) Install deps (workspaces)
COPY package.json package-lock.json ./
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN npm ci

# 2) Build Admin
COPY . .
RUN npm -w apps/admin run build

# --- Runtime ---
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/admin ./apps/admin

EXPOSE 3000
CMD ["npm", "-w", "apps/admin", "run", "start"]
