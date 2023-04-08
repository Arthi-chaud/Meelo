# Docker and Docker-compose

In your `Meelo` folder, create one last file named `docker-compose.yml`. It will look something like this:

```yml
services:
  meelo:
    image: ghcr.io/arthi-chaud/meelo:latest
    ports:
      - "5000:5000" ## Defines on which port to expose Meelo. In the container, it is exposed on port 5000
    depends_on:
      - "db"
    volumes:
      - meelo:/meelo
      - data:/data
    env_file:
      - .env
  redis:
    image: redis:7.0-alpine
    healthcheck:
      test: ["CMD", "redis-cli","ping"]
      interval: 5s
      timeout: 5s
      retries: 5
  db:
    image: postgres:alpine3.14
    env_file:
      - .env
    volumes:
      - db:/var/lib/postgresql/data
volumes:
  db:
  config:
  data:
```

A few things to know:

- You are free to configure your database volume as you want.
- The `data` volume should be mapped to a folder that contains all your libraries
- The `meelo` volume should be mapped from your `Meelo` folder.
