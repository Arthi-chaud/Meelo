# Meelo's Album Types

In Music Apps, we usually call any song container an *Album*. While this is technically incorrect, many music streaming services categorizes these *Albums* in sub-categories: Albums, Singles, Live, Compilations, etc.

## Available Types

Meelo supports this categorization, and the following album types:

- Studio Recording
  - What we would usually call *Albums*
- Live Recording
- Compilation
- Single
- Soundtrack
- Remix Album
  - Collections that would mainly have remixes of songs by a single artist, while not being a Single
- Video Album
  - Any kind of collection that would only contain video tracks

## Type recognition

Meelo tries to be as independent of user interactions as possible. Therefore, type recognition is done automatically, when a new album is registered.

For now, Type recognition is solely based on the Album's title. Keywords to recognize an album's type were inspired by the way other music streaming services would categorize an album. Therefore, if your music collection's naming convention work a similar way to Spotify, Apple Music, ..., there might not be a lot to change if you want to fully enjoy this feature. However, if you consider that one of the following ways to recognize a type is incomplete or incorrect, feel free to [open an issue](https://github.com/Arthi-chaud/Meelo/issues).

### Keywords

| Album Type | Keywords |
|---|---|
| Studio Album | See note below |
| Compilations | - `best of`<br>- `hits`<br>- `greatest hits`<br>- `singles`<br>- `collection`<br>+ See note below |
| Live Recording | - '` tour`' (Notice the leading whitespace)<br>- `live from`<br>- `live at`<br>- `unplugged`<br>- `(live)` |
| Single | - `- single`<br>- `- ep`<br>- `(remixes)` |
| Video Album | - `music videos`<br>- `the video`<br>- `dvd` |
| Remix Album | - `remix album`<br>- `mixes`<br>- `the remixes`<br>- `remixed`<br>- `remixes`<br>- `best mixes` |
| Soundtrack | - `soundtrack`<br>- `from the motion picture`<br>- `music from and inspired by` |

Notes:

- Keywords are case-insensitive.
- Any album that would not fall into the other categories will be considered to be a Compilation IF the album is a 'compilation' album (see metadata)
- Any album that would not fall into the other categories will be considered to be a Studio Recording
