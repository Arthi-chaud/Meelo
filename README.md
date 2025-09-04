<div align="center" style="display: flex; justify-content: center; align-items: center;">
  <img width="500"  alt="3ee05d00-f8de-45d9-aa1f-2a0a9f877925" src="https://github.com/user-attachments/assets/45f9e62e-ba1f-4068-a8d7-fdb042989020" />
</div>

**<div align="center">[Features](#star-features) • [Setup](#-setup) • [Screenshots](#camera-screenshots) • [Wiki](https://github.com/Arthi-chaud/Meelo/wiki)</div>**

<img width="2560" height="1011" alt="screens-1" src="https://github.com/user-attachments/assets/5cfbbe83-dd3b-4590-949f-851b5c23ad15" />

<img width="2560" height="768" alt="screens-2" src="https://github.com/user-attachments/assets/b1fa9cf6-1487-4983-9f00-3bb6ae1a2f56" />


Welcome! Meelo is a self-hosted music server. It works similarly to Plex, Jellyfin, Koel and Black Candy, but focuses on flexibility, browsing and listening experiences. Actually, Meelo is designed for music collectors. What does it mean? Scroll down to see our killer features :arrow_heading_down:

While the software aims to be a flexible as possible, it requires a little bit of setup. However, once everything is ready, you will just have to sit back, relax, and enjoy your music. :sunglasses:

## :star: Features

Meelo has all the basic features you might expect from a music player/server (playback, browsing, search, playlists, libraries ...). But it comes with a handful of features that make it unique :star_struck:

- Music Videos are first-class citizens
  - Access them directly from an album's, artist's or song's page
  - We also differentiate music video from interviews, behind-the-scenes, trailers...
- Identifies B-Sides
  - Meelo shows you any tracks that could be related to an album directly on the album's page!
- ... and Rare tracks
  - And show them on the artist's page, so that these rare gems do not get lost and forgotten!
- Automatic 'featuring' and duet detection
- Albums have _releases_
  - Meaning that you can have multiple versions of a single album
  - But only its _main_ version would appear on browsing pages
  - Of course, you can still access its other versions, directly from the album's page
- Songs have _tracks_
  - It is pretty much the same as for albums and releases
  - No duplicated songs when browsing your library!
- Songs have _versions_
  - See an example [here](./assets/examples/song-groups.png)
- Album and Song types
  - Finding instrumental songs or live recordings has never been this simple!
- Filter Songs that are exclusive to an album (for compilation albums only)
- Supports all formats!
  - Thanks to transcoding and the way we parse files, any audio and video format is virtually supported
  - (Note: Transcoding is only used when the file format is not supported in the browser)
- Flexible metadata parsing
  - Use either the embedded metadata or the file's name (or both!) to extract metadata
  - Also works with album covers!
- Get genres, descriptions, and ratings using MusicBrainz, Genius, Wikipedia and many other providers!
- Push Scrobbles to ListenBrainz and LastFM!
- Download (synced) lyrics or get them from embedded metadata and `.lrc` files

Keep track of the upcoming features [here](https://github.com/Arthi-chaud/Meelo/issues)

## 🔧 Setup

:point_right: To get started, follow the dedicated [wiki](https://github.com/Arthi-chaud/Meelo/wiki).

You'll need a 'clean' collection: either with embedded metadata or standard file/folder architecture. Using iTunes or Beets is a great way to start.

> [!NOTE]  
> Meelo is shipped though Docker images. You might need to know a bit about Regexes.

## :iphone: Android App

> [!NOTE]  
> Meelo now has an Android app :tada:. However, it is still in alpha and lacks some important features.
>
> Go [here](https://github.com/Arthi-chaud/Meelo/discussions/1130) for more information.
> You can find the known issues and the list of missing/upcoming features [here](https://github.com/Arthi-chaud/Meelo/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22Front%20(Mobile)%22)
> 
> While the app is in alpha, we recommend using the web app. With its responsive design, it works perfectly on mobile devices.

## :desktop_computer: Live Demo

We are actively working on a public demo, so that you can try out Meelo. Stay tuned...

## :camera: Screenshots

<details>
  <summary>Unfold to see what the web application looks like!</summary>

https://github.com/user-attachments/assets/48141241-25ec-4570-a4f1-696c0cdfcaaa

---

![Album View 1](./assets/examples/album-top.png)
![Album View 2](./assets/examples/album-page.png)
![Artist Page](./assets/examples/artist-page.png)
![Player Page](./assets/examples/player.png)
![Release Page](./assets/examples/releases.png)
![Synced Lyrics](./assets/examples/synced-lyrics.gif)

More screenshots [here](./assets/examples/)

</details>

## 🌐 Translation

Meelo uses [Weblate](https://weblate.org/en-gb/) to handle translations.
Feel free to contribute [here](https://hosted.weblate.org/engage/meelo/)!

[![Stats](https://hosted.weblate.org/widget/meelo/front/multi-auto.svg)](https://hosted.weblate.org/engage/meelo/)

Any questions about this? Open a discussion [here](https://github.com/Arthi-chaud/Meelo/discussions/categories/translation)!

## :handshake: Contributing and Bugs reporting

:thinking: Is there a feature you would like to have? [Open an issue](https://github.com/Arthi-chaud/Meelo/issues/new/choose), and we will be happy to discuss it!

:wrench: Need help with the setup process? Open a discussion [here](https://github.com/Arthi-chaud/Meelo/discussions/categories/need-help-with-setting-up).

:bug: Have you encountered a bug? Ugh we don't like 'em here! Report it by [opening an issue](https://github.com/Arthi-chaud/Meelo/issues/new/choose).

:hammer: Would you like to contribute to Meelo? Feel free to [open a pull request](https://github.com/Arthi-chaud/Meelo/compare).

---

Get ready to make the most out of you music collection!

[![Coverage (Back-end)](https://sonarcloud.io/api/project_badges/measure?project=arthi-chaud_Meelo-back&metric=coverage)](https://sonarcloud.io/summary/new_code?id=arthi-chaud_Meelo-back)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=arthi-chaud_Meelo-back&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=arthi-chaud_Meelo-back)
