# Prepare your settings

In your `Meelo` folder, download and fill [this `settings.json` file](https://raw.githubusercontent.com/Arthi-chaud/Meelo/master/settings.json)

All fields are **required**

- `dataFolder`: This fields defines where the server will find the **libraries** **in the docker container**. Defining where your music is on the host machine will be done later. You can name it whatever you want.
- `trackRegex`: Probably the most important setting for Meelo. This field takes an array of strings, each string being a Regular Expression string. The RegExp will be used to find the files to import (It will be matched against the **absolute path** of the file). As mentioned before, the path of the file can be used as a metadata source. Therefore, **the Regular Expression accepts groups to find metadata**:
  - `AlbumArtist`: The artist of the parent album.
    - Special Case: If it equals `Compilations`, related album will be considered as compilation albums (with no main artist, like soundtrack albums)
  - `Artist`: The artist of the track. If it is not present, it will use the `AlbumArtist` field.
  - `Release`: Usually no present in a standard file architecture; the name of the *release*. When it is not present, the `Album` field will be used.
  - `Album`: The name of the album of the material. This field will then be parsed to group related album releases.
  - `Year`: The Year of the release of the material
  - `Disc`: The Index of the disc the track is on.
  - `Index`: The index of the track in a playlist/on a disc.
  - `Track`: The name of the track
  - `Genre`: The genre of the material
  - `DiscogsID`: The Discogs ID of the parent release. A Discogs ID should take the form of a digit-only string. This ID can be found in the URL of the release's Discogs page or in the top-right corner of that page (displayed as `[rXXXXXXXX]`)
- `metadata`: Configuration of the **metadata extraction** system:
  - `source`: The **primary metadata source** to use:
    - `embedded`: Using the embedded tags
    - `path`: Using the Regular Expression's groups.
  - `order`: Define the missing metadata fallback behaviour. *Note*: if this method is enabled, it will consider 'cover.*' file in the same directory as the media file as an illustration candidate.
    - `only`: If a field is missing from the primary metadata source, will not use the other method to get it.
    - `preferred`: If a field is missing from the primary metadata source, will try to use the other method to get it.
- `providers`: Please refer to [*Providers*](../providers)
- `compilations`:
  - `artists`: Optional field. If an album artist in this list, their albums will be considered to be compilation albums.
  - `useID3CompTag`: If true, use iTunes' non-standard ID3 tags for compilations.

*Note*: The provided Regular Expression uses the iTunes file architecture.
