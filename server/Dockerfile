FROM node:18-alpine AS base
RUN apk update && apk add openssl1.1-compat

FROM base AS builder
WORKDIR /app
# Source: https://stackoverflow.com/questions/67903114/javascript-heap-out-of-memory-in-docker-image-run
ENV NODE_OPTIONS=--max-old-space-size=16384
COPY ./*.json ./
COPY ./*.lock ./
COPY ./src ./src
COPY ./prisma/ ./prisma
RUN yarn install --frozen-lockfile
RUN yarn run build	\
	&& yarn install --production --frozen-lockfile

FROM base as runner
WORKDIR /app
RUN apk add ffmpeg
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

CMD yarn run prisma migrate dev --skip-generate && yarn run start:prod