# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS migrate
COPY . .
ENV DATABASE_URL=postgresql://bismillah:bismillah@postgres:5432/bismillah
ENV DIRECT_URL=postgresql://bismillah:bismillah@postgres:5432/bismillah
RUN pnpm --filter @bismillah/db generate
CMD ["pnpm", "--filter", "@bismillah/db", "migrate"]

FROM deps AS api
COPY . .
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://bismillah:bismillah@postgres:5432/bismillah
ENV DIRECT_URL=postgresql://bismillah:bismillah@postgres:5432/bismillah
RUN pnpm --filter @bismillah/db generate
EXPOSE 4000
CMD ["pnpm", "--filter", "@bismillah/api", "start"]

FROM deps AS build
COPY . .
ARG APP=web
ARG NEXT_PUBLIC_STORE_URL=
ARG NEXT_PUBLIC_API_URL=/
ARG NEXT_PUBLIC_GTM_ID=
ARG NEXT_PUBLIC_GA_ID=
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=1
ENV BUILD_STANDALONE=1
ENV DATABASE_URL=postgresql://bismillah:bismillah@127.0.0.1:5432/bismillah
ENV DIRECT_URL=postgresql://bismillah:bismillah@127.0.0.1:5432/bismillah
ENV NEXT_PUBLIC_STORE_URL=$NEXT_PUBLIC_STORE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
RUN pnpm --filter @bismillah/db generate
RUN pnpm --filter @bismillah/${APP} build
RUN mkdir -p apps/${APP}/public

FROM base AS runner
ARG APP=web
ARG PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV APP=$APP
ENV PORT=$PORT
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=build --chown=nextjs:nodejs /app/apps/${APP}/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/${APP}/.next/static ./apps/${APP}/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/${APP}/public ./apps/${APP}/public
USER nextjs
EXPOSE ${PORT}
CMD ["sh", "-c", "if [ -f apps/${APP}/server.js ]; then exec node apps/${APP}/server.js; else exec node server.js; fi"]
