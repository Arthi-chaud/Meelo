# Environment variables

In your `Meelo` directory, create a `.env` file and fill out the following variables

```ini
# Username to access database
POSTGRES_USER=
# Password to access database
POSTGRES_PASSWORD=
# Name of Meelo's database 
POSTGRES_DB=
# Hostname from which Meelo can access the database
# If dockerized, this must be the container_name
POSTGRES_HOST=
# Hostname from which Meelo can access the redis queues
# If dockerized, this must be the container_name
REDIS_HOST=
# Random String used to sign JWT Tokens
JWT_SIGNATURE=
# The path to the `settings.json` file, and the illustration/metadata folder 
MEELO_DIR=
# Do not change this
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}?schema=public
```
