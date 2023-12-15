# Source : https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
FROM node:18-alpine3.18 AS base
FROM base AS builder
WORKDIR /app
COPY ./*.json ./
COPY ./*.lock ./
RUN yarn install --production --frozen-lockfile

COPY ./next.config.js .
## To Provide static assets at build time
COPY ./public ./public
COPY ./src ./src
ENV NEXT_TELEMETRY_DISABLED 1
RUN yarn build

FROM base as runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD node server.js
