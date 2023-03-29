# Create your first library

After creating the admin account (from Web App),
Send the following `POST` request to `/api/libraries/new`:

```json
{
  "name": "Library Name", // The name of the library to create
  "path": "" // The path of the library, relative to /data folder.
}
```

*Note*: To know more about the API routes, visit the `/api/swagger` route.

Once your library is created, you should run a scan to collect the related files. To do so, send a `GET` request to `/api/tasks/scan`. You'll see the scan steps in the docker logs

Your Meelo server is ready to be used! Visit the `/` route on your favourite browser to enjoy your favourite music :).
