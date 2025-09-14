FROM node:22-alpine3.20 AS base
RUN apk update && apk add openssl

FROM base AS builder
WORKDIR /app
# Source: https://stackoverflow.com/questions/67903114/javascript-heap-out-of-memory-in-docker-image-run
ENV NODE_OPTIONS=--max-old-space-size=16384
COPY ./*.json ./.yarnrc.yml ./*.lock  ./
COPY ./.yarn ./.yarn
RUN corepack enable
RUN yarn workspaces focus
COPY ./src ./src
COPY ./prisma/ ./prisma
RUN yarn install --immutable
RUN yarn run build && yarn workspaces focus --all --production

FROM base as runner
ARG VERSION=unknown
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=builder /app/.yarn ./.yarn
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
RUN corepack enable
ENV VERSION=$VERSION

CMD ["/bin/sh", "-c", "yarn run prisma migrate dev --skip-generate && yarn run start:prod"]

