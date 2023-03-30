# Start Meelo

Once these three files are ready, run the following command from your `Meelo` folder:

```bash
docker-compose up
```

## Troubleshooting

Two things can prevent Meelo from starting normally:

- A bad `settings.json` file
  - In that case, a message should tell you what went wrong
- Connection to database failed
  - In that case, you should have a red message telling you a query failed. To fix, simply restart the server
