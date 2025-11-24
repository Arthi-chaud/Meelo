UPDATE
    albums
SET
    "sortSlug" = TRIM('-' FROM "sortSlug");

UPDATE
    artists
SET
    "sortSlug" = TRIM('-' FROM "sortSlug");

UPDATE
    videos
SET
    "sortSlug" = TRIM('-' FROM "sortSlug");

UPDATE
    songs
SET
    "sortSlug" = TRIM('-' FROM "sortSlug");

