# Meelo - Server

## Dev env

### Tests

To run test, create a `.env.yarn` file, and fill it with this:

```
REDIS_HOST=${REDIS_HOST:=localhost}
POSTGRES_HOST=localhost
INTERNAL_CONFIG_DIR=test/assets/
INTERNAL_DATA_DIR=test/assets/
```

Then run

```bash
yarn test:setup # Once
yarn test
```
