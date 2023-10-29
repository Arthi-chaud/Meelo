# Docker and Docker-compose

In your `Meelo` folder, copy this [file](https://raw.githubusercontent.com/Arthi-chaud/Meelo/master/docker-compose.prod.yml) as `docker-compose.yml`. Feel free to change the volumes' configuration.

A few things to know:

- You are free to configure your database volume as you want.
- The `data` volume should be mapped to a folder that contains all your libraries
- The `meelo` volume should be mapped from your `Meelo` folder.
