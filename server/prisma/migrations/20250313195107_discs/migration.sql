-- AlterTable
ALTER TABLE "tracks"
    ADD COLUMN "discName" TEXT;

CREATE VIEW "discs" AS (
    SELECT
        DISTINCT ON ("releaseId", "discIndex")
        "id",
        "releaseId",
        "discIndex" AS "index",
        "discName" AS "name"
    FROM
        "tracks"
    ORDER BY
        "releaseId",
        "index",
        "name" ASC NULLS LAST);

