![Meelo](./front/public/banner.png)

## Your music, your files, your experience

[![Build](https://github.com/Arthi-chaud/Meelo/actions/workflows/build.yml/badge.svg)](https://github.com/Arthi-chaud/Meelo/actions/workflows/build.yml)
[![Coverage (Back-end)](https://sonarcloud.io/api/project_badges/measure?project=arthi-chaud_Meelo-back&metric=coverage)](https://sonarcloud.io/summary/new_code?id=arthi-chaud_Meelo-back)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=arthi-chaud_Meelo-back&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=arthi-chaud_Meelo-back)

Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
This project is made by and for music collectors. Its goal is to have a clean, organized, easy and accessible way to store and serve files.

## Getting Started

- [Setup Instructions](https://arthi-chaud.github.io/Meelo/setup/requirements/)

## Features

- Files organized in *Libraries*
- Scan for new files, and remove deleted files
- Music Organization close to a Music Collector's collection
  - Artist
  - Album
    - Releases
  - Songs
    - Tracks
    - Versions
- Access, stream, and download songs from your server
- Music Videos
- B-Sides
- Playlists
- Metadata scan using:
  - Embedded tags (including bitrate)
  - Path of file, using [customizable Regular Expressions](https://arthi-chaud.github.io/Meelo/setup/settings)
  - Either using one of the two, or the two combined
- Album Typing
  - Studio Recording
  - Single
  - Live Album
  - Video Album
  - Soundtrack Album
  - etc...
  - Look over [here](https://arthi-chaud.github.io/Meelo/album-types/) to know how it works
- ... And allow filtering based on Album's types
- Song Typing
  - Original Version
  - Demo Version
  - Instrumental Version
  - Remix
  - Acoustic Version
  - Edit
  - Clean Version
- Embedded and inline artwork file handling
- External Metadata Providers (Optional)
  - Genius
  - MusicBrainz
- Match Releases with Discogs
- Automated Lyrics download
- User management
- Multi-language support
  - English
  - French

Keep track of the upcoming features with the [project's issues](https://github.com/Arthi-chaud/Meelo/issues)

## Why Meelo could be what you are looking for

[Plex](https://www.plex.tv/fr/), [Beets](https://github.com/beetbox/beets), [Koel](https://github.com/koel/koel), as well as iTunes are awesome solutions if you have a 'simple' music collection, but they are not tailored for music collectors, who usually have multiple versions of a single album, multiple files for one single song (from multiple album releases). Therefore, their library ends up clustered and unpleasant to browse and use.

## The philosophy behind Meelo

The idea behind Meelo is to have a pleasant way to browse and enjoy your collection and making it the *best* one possible.

The *best* music collection is a collection that is fully useable in any music server (like one mentioned above). The only way to reach this goal is to make the music collection independent metadata-wise, i.e. having all the metadata embedded in the files themselves.
To use Meelo, you'll need a 'clean' collection: either with embedded metadata or standard file/folder architecture. Using iTunes is a great way to start.

## Screenshots

![Album View](./assets/examples/album-page.png)

More screenshots [here](./assets/examples/)
