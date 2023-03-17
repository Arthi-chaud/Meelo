## Backend
FROM node:18-alpine AS server-builder
WORKDIR /app/server
COPY ./server/*.json ./
COPY ./server/*.lock ./
RUN yarn
COPY ./server/src ./src
COPY ./server/prisma/ ./prisma
## To Provide static assets at build time
COPY ./assets /app/assets
RUN yarn run prebuild
RUN yarn run build
## Removing dev dependencies
RUN yarn install --production


## Frontend
FROM node:18-alpine AS front-builder
WORKDIR /app/front
COPY ./front/*.json ./
COPY ./front/*.lock ./
RUN yarn install --production
COPY ./front/public ./public
COPY ./front/src ./src
COPY ./front/next.config.js .
## To Provide static assets at build time
COPY ./assets /app/assets
RUN yarn build

FROM node:18-alpine
WORKDIR /app
RUN apk update && apk add ffmpeg nginx
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY --from=server-builder /app/server/package.json ./server/package.json
COPY --from=server-builder /app/server/prisma ./server/prisma
COPY --from=front-builder /app/front/.next ./front/.next
COPY --from=front-builder /app/front/node_modules ./front/node_modules
COPY --from=front-builder /app/front/package.json ./front/
COPY --from=front-builder /app/front/public ./front/public
COPY --from=front-builder /app/front/next.config.js ./front/
COPY ./assets ./assets
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./Meelo .
RUN chmod +x Meelo
CMD nginx ; ./Meelo prod
