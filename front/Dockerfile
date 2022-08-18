FROM node:17 AS builder
WORKDIR /app
COPY ./package.json ./
RUN yarn install
COPY . .

FROM node:17-alpine
WORKDIR /app
COPY --from=builder /app ./
CMD yarn run build

