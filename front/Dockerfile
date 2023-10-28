# Source : https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY ./*.json ./
COPY ./*.lock ./
COPY ./next.config.js .
RUN yarn install --production --frozen-lockfile

## To Provide static assets at build time
COPY ./public ./public
COPY ./src ./src
ENV NEXT_TELEMETRY_DISABLED 1
RUN yarn build

FROM node:18-alpine
ENV NODE_ENV production
WORKDIR /app

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

CMD node server.js