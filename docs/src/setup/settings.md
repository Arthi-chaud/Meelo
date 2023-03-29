# Prepare your settings

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
  },
  "providers": {
    "genius": {},
    "musicbrainz": {}
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
- `providers`: Please refer to [*Providers*](../providers)

*Note*: The provided Regular Expression uses the iTunes file architecture.
