# Setting Up

Meelo is easy to setup! But you'll need the following thing before continuing

- Have you music library ready (see [this step](#prepare-your-music-library))
- Know how `Docker` and `docker-compose` work
- Know how to create a `.env` file
- Know how to manipulate Regular Expressions (Especially the ECMAScript flavor)

## Prepare your music library

The toughest part is to have an organised music library. The way files are organized are up to you! But here is a recommended architecture:

```tree
Library's Folder   
│
Artist 1
│   │
│   └───Album 1
│       │   01 Track 1.m4a
│       │   02 Track 2.m4a
|       |   cover.jpg
│       │   ...
│   ...
```

Meelo provides two way of collecting metadata: using embedded tags, or using the path of the file. If a metadata source does not provide a specific field, you can use the other as a fallback. (You will configure this behaviour in the next sections). But before going any further, you should decide which metadata collection method to use.

## Create a configuration folder

Meelo is runnable through a Docker container. But it needs a way to be parameterized and persist some data.

Therefore, it is recommended that you create a dedicated folder on your computer for Meelo.

For clarity sake, in this documentation, we'll name this folder `Meelo`.

## Prepare your settings

In your `Meelo` folder create a `settings.json` file. It will look like this:

```json
{
  "dataFolder": "/data",
  "trackRegex": [
    "^([\\/\\\\]+.*)*[\\/\\\\]+(?<Artist>.+)[\\/\\\\]+(?<Album>.+)(\\s*\\((?<Year>\\d{4})\\))?[\\/\\\\]+((?<Disc>[0-9]+)-)?(?<Index>[0-9]+)\\s+(?<Track>.*)\\..*$"
  ],
  "metadata": {
    "source": "embedded",
    "order": "only"
  }
}
```

All fields are **required**

- `dataFolder`: This fields defines where the server will find the **libraries** **in the docker container**. Defining where your music is on the host machine will be done later. You can name it whatever you want.
- `trackRegex`: Probably the most important setting for Meelo. This field takes an array of strings, each string being a Regular Expression string. The RegExp will be used to find the files to import, the path being **relative to the parent library, not the `dataFolder`**. As mentioned before, the path of the file can be used as a metadata source. Therefore, **the Regular Expression accepts groups to find metadata**:
  - `AlbumArtist`: The artist of the parent album.
    - Special Case: If it equals `Compilations`, related album will be considered as compilation albums (with no main artist, like soundtrack albums)
  - `Artist`: The artist of the track. If it is not present, it will use the `AlbumArtist` field.
  - `Release`: Usually no present in a standard file architecture; the name of the *release*. when it is not present, the `Album` field will be used.
  - `Album`: The name of the album of the material. This field will then be parsed to group related album releases.
  - `Year`: The Year of the release of the material
  - `Disc`: The Index of the disc the track is on.
  - `Index`: The index of the track in a playlist/on a disc.
  - `Track`: The name of the track
  - `Genre`: The genre of the material
- `metadata`: Configuration of the **metadata extraction** system:
  - `source`: The **primary metadata source** to use:
    - `embedded`: Using the embedded tags
    - `path`: Using the Regular Expression's groups.
  - `order`: Define the missing metadata fallback behaviour. *Note*: if this method is enabled, it will consider 'cover.*' file in the same directory as the media file as an illustration candidate.
    - `only`: If a field is missing from the primary metadata source, will not use the other method to get it.
    - `preferred`: If a field is missing from the primary metadata source, will try to use the other method to get it.

*Note*: The provided Regular Expression uses the iTunes file architecture.

## Environment variables

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
# The Access Token of Genius to download lyrics
# Optional
GENIUS_ACCESS_TOKEN=
# Random String used to sign JWT Tokens
JWT_SIGNATURE=
# Do not change this
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}?schema=public
```

## Docker and Docker-compose

In your `Meelo` folder, create one last file named `docker-compose.yml`. It will look something like this:

```yml
services:
  meelo:
    build:
      context: ./
    ports:
      - "5000:5000" ## Defines on which port to expose Meelo. In the container, it is exposed on port 5000
    depends_on:
      - "db"
    volumes:
      - meelo:/meelo
      - data:/data
    env_file:
      - .env
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

- you are free to configure your database volume as you want.
- the `data` volume should be mapped to a folder that contains all your libraries
- the `meelo` volume should be mapped from your `Meelo` folder.

## Start Meelo

Once these three files are ready, run the following command from your `Meelo` folder:

```bash
docker-compose up --build
```

### Troubleshooting

Two things can prevent Meelo from starting normally:

- A bad `settings.json` file
  - In that case, a message should tell you what went wrong
- Connection to database failed
  - In that case, you should have a red message telling you a query failed. To fix, simply restart the server

## Create your first library

Send the following `POST` request to `/api/libraries/new`:

```json
{
  "name": "Library Name", // The name of the library to create
  "path": "" // The path of the library, relative to /data folder.
}
```

*Note*: To know more about the API routes, visit the `/api/docs` route.

Once your library is created, you should run a scan to collect the related files. To do so, send an `GET` request to `/api/tasks/scan`. You'll see the scan steps in the docker logs

Your Meelo server is ready to be used! Visit the `/` route on your favorite browser to enjoy your favorite music :).
