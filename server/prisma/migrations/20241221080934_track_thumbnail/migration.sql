/*
 Warnings:

 - A unique constraint covering the columns `[thumbnailId]` on the table `tracks` will be added. If there are existing duplicate values, this will fail.
 */
-- AlterTable
ALTER TABLE "tracks"
    ADD COLUMN "thumbnailId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "tracks_thumbnailId_key" ON "tracks" ("thumbnailId");

-- AddForeignKey
ALTER TABLE "tracks"
    ADD CONSTRAINT "tracks_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "illustrations" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update Track Illustration View so that it returns the thumbnail first
CREATE OR REPLACE VIEW "track_illustrations_view" AS
SELECT
    i.*,
    t.id AS "trackId"
FROM
    tracks t
    JOIN releases r ON r.id = t."releaseId"
    -- Left join, because release can be null or not have artwork.
    -- In that case, we still want videos to have their thumbnails
    LEFT JOIN LATERAL (
        SELECT
            "illustrationId"
        FROM
            release_illustrations ri
        WHERE
            ri."releaseId" = r."id"
            AND (
                -- Take Exact disc/track illustration
                ((ri.disc IS NOT DISTINCT FROM t."discIndex")
                    AND (ri.track IS NOT DISTINCT FROM t."trackIndex"))
                OR (
                    -- Take disc illustration
                    (ri.disc IS NOT DISTINCT FROM t."discIndex")
                    AND (ri.track IS NULL))
                OR (
                    -- Or the release illustration
                    (ri.disc IS NULL)
                    AND (ri.track IS NULL)))
        ORDER BY
            track NULLS LAST,
            disc ASC NULLS LAST
        LIMIT 1) AS ri ON TRUE
    -- TODO: Avoid join lateral if there's a thumbnail
    -- If there is a thumbnail for this track, prefer it to the artwork
    JOIN illustrations i ON i.id = COALESCE(t."thumbnailId", ri."illustrationId");

