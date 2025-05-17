# Source : https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
FROM node:18-alpine3.18 AS base
FROM base AS builder
WORKDIR /app

# Yarn stuff
COPY ./.yarnrc.yml ./*.lock  ./
COPY ./.yarn ./.yarn

# Package.json + tsconfig
## Root
COPY package.json tsconfig.base.json ./
## Apps
COPY apps/web/*.json apps/web/
## Libs
COPY packages/*.json packages/
COPY packages/api/*.json packages/api/
COPY packages/models/*.json packages/models/
COPY packages/state/*.json packages/state/
COPY packages/utils/*.json packages/utils/

# Install Libraries
RUN yarn workspaces focus -A 

# NextJS
COPY ./apps/ apps/
COPY ./packages/ packages/
COPY ./translations/ translations/
COPY ./assets/* apps/web/public/

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN yarn build:web

######

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone/apps/web ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
