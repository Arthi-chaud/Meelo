# Meelo's Scanner

## Configuration

### Environment Variables

- `API_URL`: URL to the API
- `INTERNAL_CONFIG_DIR`: Path of the directory that contains the `settings.json` file
- `INTERNAL_DATA_DIR`: Path of the directory where all the libraries are.
- `API_KEY`: Key used to authenticate to the API.
  - Or if `API_KEYS` exists and is a coma-separated string, we will take the first strings before the first `,`. 

### Files

- `settings.json`: JSON File located in `INTERNAL_CONFIG_DIR`. See user doc for specs
