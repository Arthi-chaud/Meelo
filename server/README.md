# Meelo's Server

## Configuration

### Environment Variables

- `MEILI_HOST`: Hostname of the service with a Meilisearch instance
- `MEILI_MASTER_KEY`: Master Key used to authenticate to Meilisearch
- `RABBITMQ_URL`: URL of the RabbitMQ instance
  - Example: `amqp://rabbitmq:rabbitmq@localhost:5672`
- `TRANSCODER_URL`: URL of the Transcoder service
  - Example: `http://transcoder:7666`
- `API_KEYS`: List of comma separated keys used by microservices (e.g. scanner) to authenticate
- `JWT_SIGNATURE`: Random String used to sign JWT Tokens
- `ENABLE_USER_REGISTRATION`: If set to `0`, users will not be able to create accounts. Do not set this to `0` if you haven't created the first admin account yet
- `ALLOW_ANONYMOUS`: If `1`, anonymous requests will be allowed on read-only endpoints
- `INTERNAL_CONFIG_DIR`: Path of the directory that contains the `settings.json` file
- `INTERNAL_DATA_DIR`: Path of the directory where all the libraries are.
- `LASTFM_API_KEY`& `LASTFM_API_SECRET`: Key and secret obtained when creating an API account on LastFM

### Files

- `settings.json`: JSON File located in `INTERNAL_CONFIG_DIR`. See user doc for specs
