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



FROM squidfunk/mkdocs-material AS doc-builder
WORKDIR /app/docs
COPY ./assets /app/assets
COPY ./docs /app/docs
RUN pip install -r requirements.txt
RUN mkdocs build

FROM node:18-alpine
WORKDIR /app
RUN apk update && apk add ffmpeg nginx
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY --from=server-builder /app/server/package.json ./server/package.json
COPY --from=server-builder /app/server/prisma ./server/prisma
COPY --from=doc-builder /app/docs/site /app/docs
COPY ./assets ./assets
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./Meelo .
RUN chmod +x Meelo
CMD nginx ; ./Meelo prod
