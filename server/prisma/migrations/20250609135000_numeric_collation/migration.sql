-- https://stackoverflow.com/a/67975489
CREATE COLLATION numeric (
    provider = icu,
    locale = 'en@colNumeric=yes'
);

ALTER TABLE "songs"
    ALTER COLUMN "nameSlug" TYPE TEXT COLLATE numeric;

ALTER TABLE "artists"
    ALTER COLUMN "slug" TYPE TEXT COLLATE numeric;

ALTER TABLE "albums"
    ALTER COLUMN "nameSlug" TYPE TEXT COLLATE numeric;

ALTER TABLE "playlists"
    ALTER COLUMN "slug" TYPE TEXT COLLATE numeric;

ALTER TABLE "releases"
    ALTER COLUMN "nameSlug" TYPE TEXT COLLATE numeric;

