# Meelo's Matcher 

This microservice is responsible for getting metadata from external providers (MusicBrainz, Genius, etc.)

It receives events through a message queue, and pushes the metadata to the API (using the HTTP API).

## Configuration

### Environment Variables

### Files

- `settings.json`: JSON File located in `INTERNAL_CONFIG_DIR`. See user doc for specs.
