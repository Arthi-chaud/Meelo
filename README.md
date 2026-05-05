<div align="center" style="display: flex; justify-content: center; align-items: center;">
<img width="500" src="https://github.com/user-attachments/assets/8d9b147f-aad3-4cd7-898b-01e58f65dd7c" />
</div>

**<div align="center">[Features](#star-features) • [Setup](#-setup) • [Screenshots](#camera-screenshots) • [Wiki](https://github.com/Arthi-chaud/Meelo/wiki)</div>**

<img src="https://github.com/user-attachments/assets/4a489a25-3cf7-4281-a9c1-cf9d41351e69" />


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

Keep track of the upcoming features [here](https://github.com/Arthi-chaud/Meelo/issues).

<img src="https://github.com/user-attachments/assets/7e1fe7df-638c-42f1-978d-e1cb59f91324" />

## :iphone: Mobile App

Meelo has a mobile app for both Android and iOS :tada:.

You can find the known issues and the list of upcoming features [here](https://github.com/Arthi-chaud/Meelo/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22Front%20(Mobile)%22).

- **Android**: You can download the latest stable APK on the release page. More info [here](https://github.com/Arthi-chaud/Meelo/discussions/1130)
- **iOS**: The app is distributed using TestFlight. More info [here](https://github.com/Arthi-chaud/Meelo/discussions/1533)

APKs and IPAs are also built whenever code is pushed to the main branch. Check out [this worklow](https://github.com/Arthi-chaud/Meelo/actions/workflows/front-mobile.yml?query=branch%3Amain)

## 🔧 Setup

:whale: Meelo is shipped though Docker images.

:point_right: To get started, follow the dedicated [wiki](https://github.com/Arthi-chaud/Meelo/wiki)

We love embedded metadata here. Make sure your music is correctly tagged before getting started!

> [!NOTE]
> If you want to rely on the file paths as metadata sources,  you might need to be familiar with Regexes!

## :camera: Screenshots

[![](https://github.com/user-attachments/assets/03d0d877-fc76-4078-96d5-af8e2bec3ad0)](https://github.com/user-attachments/assets/03d0d877-fc76-4078-96d5-af8e2bec3ad0)

:point_right: You can find more screenshots of the UI [here](./docs/screenshots/)

>[!NOTE]
> Some screenshots may be outdated and may not show the state of the latest version of the app. Some minor details may change (e.g. logo, spacing, etc.)
</details>


## :desktop_computer: Live Demo

We are actively working on a public demo, so that you can try out Meelo. Stay tuned...

## 🌐 Translation

Meelo uses [Weblate](https://weblate.org/en-gb/) to handle translations.
Feel free to contribute [here](https://hosted.weblate.org/engage/meelo/)!

[![Stats](https://hosted.weblate.org/widget/meelo/front/multi-auto.svg)](https://hosted.weblate.org/engage/meelo/)

🫂 A big thank you to all the translators who contributed!

Any questions about this? Open a discussion [here](https://github.com/Arthi-chaud/Meelo/discussions/categories/translation)!

## :handshake: Contributing and Bugs reporting

:thinking: Is there a feature you would like to have? [Open an issue](https://github.com/Arthi-chaud/Meelo/issues/new/choose), and we will be happy to discuss it!

:wrench: Need help with the setup process? Open a discussion [here](https://github.com/Arthi-chaud/Meelo/discussions/categories/need-help-with-setting-up).

:bug: Have you encountered a bug? Ugh we don't like 'em here! Report it by [opening an issue](https://github.com/Arthi-chaud/Meelo/issues/new/choose).

:hammer: Would you like to contribute to Meelo? Feel free to [open a pull request](https://github.com/Arthi-chaud/Meelo/compare).

## 💖 Our Sponsors

Thanks to the amazing folks who support this project:

<p align="center">
  <a href="https://github.com/Laflamme">
    <img src="https://avatars.githubusercontent.com/u/3687644?v=4" height="40"/>
  </a>
  <a href="https://github.com/alik-agaev">
    <img src="https://avatars.githubusercontent.com/u/2662697?v=4" height="40"/>
  </a>
</p>

Want to support Meelo? [Become a sponsor](https://github.com/sponsors/Arthi-chaud)

## :warning: Disclaimer

> [!WARNING]
> Meelo is intended for private use only! Do not use your instance as a public downloading platform.
> It is not intended to support heavy traffic, and it should not be used to illegally share/download copyrighted media.
> 
> The maintainers are not responsible for any misuse of the software.

---

Get ready to make the most out of you music collection!

[![Coverage (Back-end)](https://sonarcloud.io/api/project_badges/measure?project=arthi-chaud_Meelo-back&metric=coverage)](https://sonarcloud.io/summary/new_code?id=arthi-chaud_Meelo-back)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=arthi-chaud_Meelo-back&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=arthi-chaud_Meelo-back)
![Docker Pulls](https://img.shields.io/docker/pulls/arthichaud/meelo-server)

<img src="https://github.com/user-attachments/assets/4e7a161f-180a-4f95-89b1-482421018a61" />

