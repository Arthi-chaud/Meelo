# Providers

## Enabling Providers

In the `settings.json`, ff the `provider` object does not contain a provider's settings, this provider will be disabled.

Providers can also be disabled explicitly by setting the Provider's settings' field `enabled` at `false`. For example:

```json
// In settings.json
{
  //... Other properties
  "providers": {
    "provider1": {}, // Provider 1 is enabled
    // Provider 2 was not specified, it is therefore disabled
    "provider3": {
      "enabled": true // Provider 3 is enabled
    },
    "provider4": {
      "enabled": false, // Provider 4 is disabled
      "apiKey": "" // Other property of provider 4
    } 
  }
}
```

If a provider is disabled, no call to its service will be done.

## Providers' properties and features

| Provider Name | Key           | Additional Properties                                                                      | Artist Description | Artist Illustration | Album Description | Album Rating | Song Description | Song Lyrics | Release Identification | Album Genres |
|---------------|---------------|--------------------------------------------------------------------------------------------|--------------------|---------------------|-------------------|--------------|------------------|-------------|------------------------|--------------|
| Genius        | `genius`      | `apiKey`: Access Token, you can get it [here](https://genius.com/api-clients)              | x                  | x                   | x                 |              |                  | x           |                        |              |
| MusicBrainz   | `musicbrainz` | None                                                                                       |                    |                     |                   |              |                  |             |                        | x            |
| AllMusic      | `allmusic`    | None                                                                                       |                    |                     | x                 | x            |                  |             |                        |              |
| MetaCritic    | `metacritic`  | None                                                                                       |                    |                     | x                 | x            |                  |             |                        |              |
| Wikipedia     | `wikipedia`   | None                                                                                       | x                  |                     | x                 |              | x                |             |                        |              |
| Discogs       | `discogs`     | `apiKey`: Access Token, you can get it [here](https://www.discogs.com/settings/developers) | x                  |                     |                   |              |                  |             | x                      | x            |

**Warning**: Meelo heavily relies on Wikidata to optimize the metadata fetching. It is used if, and only if the MusicBrainz Provider is enabled. It is not possible to use one without the other.
