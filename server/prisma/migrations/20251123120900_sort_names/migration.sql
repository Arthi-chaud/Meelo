ALTER TABLE "albums"
    DROP COLUMN "nameSlug";

ALTER TABLE "releases"
    DROP COLUMN "nameSlug";

ALTER TABLE "songs"
    DROP COLUMN "nameSlug";

ALTER TABLE "videos"
    DROP COLUMN "nameSlug";

ALTER TABLE "artists"
    ADD COLUMN "sortName" text,
    ADD COLUMN "sortSlug" text;

ALTER TABLE "albums"
    ADD COLUMN "sortName" text,
    ADD COLUMN "sortSlug" text;

ALTER TABLE "releases"
    ADD COLUMN "sortName" text,
    ADD COLUMN "sortSlug" text;

ALTER TABLE "songs"
    ADD COLUMN "sortName" text,
    ADD COLUMN "sortSlug" text;

ALTER TABLE "videos"
    ADD COLUMN "sortName" text,
    ADD COLUMN "sortSlug" text;

-- Source: https://gist.github.com/ianks/f8fe7822515290c3a269a616cac6a03d#file-slugify-sql
CREATE EXTENSION IF NOT EXISTS "unaccent";

CREATE OR REPLACE FUNCTION tosort_str (input_title text)
    RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    first_word text;
    rest_title text;
BEGIN
    first_word := split_part(input_title, ' ', 1);
    rest_title := substring(input_title FROM position(' ' IN input_title) + 1);
    RETURN CASE WHEN lower(first_word) IN ('a', 'an', 'the', 'le', 'la')
        AND position(' ' IN input_title) > 0 THEN
        rest_title || ', ' || first_word
    ELSE
        input_title
    END;
END;
$$;

CREATE OR REPLACE FUNCTION slugify ("value" text)
    RETURNS text
    AS $$
    WITH "unaccented" AS (
        SELECT
            unaccent ("value") AS "value"
),
"lowercase" AS (
    SELECT
        lower("value") AS "value"
    FROM
        "unaccented"
),
"hyphenated" AS (
    SELECT
        regexp_replace("value", '[^a-z0-9\\-_]+', '-', 'gi') AS "value"
    FROM
        "lowercase"
),
"trimmed" AS (
    SELECT
        regexp_replace(regexp_replace("value", '\\-+$', ''), '^\\-', '') AS "value" FROM "hyphenated"
)
        SELECT
            "value"
        FROM
            "trimmed";
$$
LANGUAGE SQL
STRICT IMMUTABLE;

-- set sortName
UPDATE
    "artists"
SET
    "sortName" = tosort_str ("name");

UPDATE
    "albums"
SET
    "sortName" = tosort_str ("name");

UPDATE
    "songs"
SET
    "sortName" = tosort_str ("name");

UPDATE
    "releases"
SET
    "sortName" = tosort_str ("name");

UPDATE
    "videos"
SET
    "sortName" = tosort_str ("name");

-- Sort slug
UPDATE
    "artists"
SET
    "sortSlug" = slugify ("sortName");

UPDATE
    "albums"
SET
    "sortSlug" = slugify ("sortName");

UPDATE
    "releases"
SET
    "sortSlug" = slugify ("sortName");

UPDATE
    "songs"
SET
    "sortSlug" = slugify ("sortName");

UPDATE
    "videos"
SET
    "sortSlug" = slugify ("sortName");

ALTER TABLE "artists"
    ALTER COLUMN "sortName" SET NOT NULL,
    ALTER COLUMN "sortSlug" SET NOT NULL,
    ALTER COLUMN "sortSlug" TYPE TEXT COLLATE numeric;

ALTER TABLE "albums"
    ALTER COLUMN "sortName" SET NOT NULL,
    ALTER COLUMN "sortSlug" SET NOT NULL,
    ALTER COLUMN "sortSlug" TYPE TEXT COLLATE numeric;

ALTER TABLE "videos"
    ALTER COLUMN "sortName" SET NOT NULL,
    ALTER COLUMN "sortSlug" SET NOT NULL,
    ALTER COLUMN "sortSlug" TYPE TEXT COLLATE numeric;

ALTER TABLE "releases"
    ALTER COLUMN "sortName" SET NOT NULL,
    ALTER COLUMN "sortSlug" SET NOT NULL,
    ALTER COLUMN "sortSlug" TYPE TEXT COLLATE numeric;

ALTER TABLE "songs"
    ALTER COLUMN "sortName" SET NOT NULL,
    ALTER COLUMN "sortSlug" SET NOT NULL,
    ALTER COLUMN "sortSlug" TYPE TEXT COLLATE numeric;

