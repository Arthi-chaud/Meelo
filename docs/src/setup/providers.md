# Providers

## Enabling Rules

If the `provider` object does not contain a provider's settings, this provider will be disabled.

Providers can also be disabled explicitly by setting the Provider's settings' field `enabled` at `false`

## Genius

The Genius Provider settings requires the following info:

```json
{
  "apiKey": "" // API Key from https://genius.com/api-clients
}
```

## Musicbrainz

This provider does not need any settings. Therefore, to enable it, your settings should look like this:

```json
{
  //...
  "providers": {
    //Other provider
    "musicbrainz": {}
    //Other provider
  }
  //...
}
```
