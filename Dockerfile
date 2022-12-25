## Backend
FROM node:18 AS server-builder
WORKDIR /app/server
COPY ./server/*.json ./
COPY ./server/*.lock ./
RUN yarn
COPY ./server/src ./src
COPY ./server/prisma/ ./prisma
RUN yarn run prisma generate
RUN yarn run build


## Frontend
FROM node:18 AS front-builder
WORKDIR /app/front
COPY ./front/*.json ./
COPY ./front/*.lock ./
RUN yarn
COPY ./front .
## To Provide static assets at build time
COPY ./assets /app/assets
RUN yarn build

FROM node:18
WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg nginx
COPY --from=server-builder /app/server ./server
COPY --from=front-builder /app/front ./front
COPY ./assets ./assets
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./Meelo .
RUN chmod +x Meelo
CMD nginx ; ./Meelo prod
