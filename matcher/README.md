# Meelo's Matcher 

This microservice is responsible for getting metadata from external providers (MusicBrainz, Genius, etc.)

It receives events through a message queue, and pushes the metadata to the API (using the HTTP API).

## Configuration

### Environment Variables

- `RABBITMQ_URL`: URL to the RabbitMQ service
- `API_URL`: URL to the API/server service
- `API_KEYS`: List of comma separated keys used by microservices (e.g. scanner, matcher) to authenticate

For tests, we need additional variables:
- `GENIUS_ACCESS_TOKEN`: Token to authenticate to the Genius Provider
- `DISCOGS_ACCESS_TOKEN`: Token to authenticate to the Discogs Provider

### Files

- `settings.json`: JSON File located in `INTERNAL_CONFIG_DIR`. See user doc for specs.
