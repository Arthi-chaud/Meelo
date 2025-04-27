-- AlterTable
ALTER TABLE "playlists"
    ADD COLUMN "allowChanges" boolean NOT NULL DEFAULT FALSE,
    ADD COLUMN "isPublic" boolean NOT NULL DEFAULT TRUE,
    ADD COLUMN "ownerId" integer NOT NULL;

UPDATE
    "playlists"
SET
    "allowChanges" = FALSE,
    "isPublic" = TRUE,
    "ownerId" = (
        SELECT
            id
        FROM
            "users"
        WHERE
            "enabled" = TRUE
        ORDER BY
            id ASC);

-- AddForeignKey
ALTER TABLE "playlists"
    ADD CONSTRAINT "playlists_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "playlists"
    ALTER COLUMN "allowChanges" DROP DEFAULT,
    ALTER COLUMN "isPublic" DROP DEFAULT;

