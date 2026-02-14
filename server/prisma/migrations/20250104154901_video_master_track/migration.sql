/*
 Warnings:

 - A unique constraint covering the columns `[masterId]` on the table `videos` will be added. If there are existing duplicate values, this will fail.
 */
-- AlterTable
ALTER TABLE "videos"
    ADD COLUMN "masterId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "videos_masterId_key" ON "videos" ("masterId");

-- AddForeignKey
ALTER TABLE "videos"
    ADD CONSTRAINT "videos_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "tracks" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE VIEW "video_illustrations_view" AS
SELECT
    i.*,
    v.id AS "videoId"
FROM
    videos v
    JOIN LATERAL (
        SELECT
            id
        FROM
            tracks
        WHERE (id = v."masterId")
        OR ("videoId" = v.id)
    ORDER BY
        bitrate DESC NULLS LAST
    LIMIT 1) t ON TRUE
    JOIN track_illustrations_view ti ON ti."trackId" = COALESCE(v."masterId", t.id)
    JOIN illustrations i ON i.id = ti.id;

