FROM node:17 AS builder
WORKDIR /app
COPY ./package.json ./
RUN yarn install
COPY . .
RUN yarn run prisma generate
RUN yarn run build

FROM node:17-alpine
WORKDIR /app
COPY --from=builder /app ./
RUN yarn run prisma migrate deploy
CMD ["yarn", "run", "start:prod"]

