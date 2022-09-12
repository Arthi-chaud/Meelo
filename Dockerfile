## Backend
FROM node:17 AS back-builder
WORKDIR /app/back
COPY ./*.json ./
COPY ./*.lock ./
RUN yarn
COPY ./src ./src
COPY ./prisma/ ./prisma
RUN yarn run prisma generate
RUN yarn run build


## Frontend
FROM node:17 AS front-builder
WORKDIR /app/front
COPY ./front/*.json .
COPY ./front/*.lock .
RUN yarn
COPY ./front .
RUN yarn build

FROM node:17
WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg nginx
COPY --from=back-builder /app/back ./back
COPY --from=front-builder /app/front ./front
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./Meelo .
RUN chmod +x Meelo
CMD nginx ; ./Meelo prod
