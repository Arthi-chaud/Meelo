FROM node:18
WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg nginx
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./Meelo .
CMD nginx ; ./Meelo dev