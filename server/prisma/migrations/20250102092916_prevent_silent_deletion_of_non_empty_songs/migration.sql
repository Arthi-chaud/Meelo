-- DropForeignKey
ALTER TABLE "videos"
    DROP CONSTRAINT "videos_groupId_fkey";

-- DropForeignKey
ALTER TABLE "videos"
    DROP CONSTRAINT "videos_songId_fkey";

-- DropForeignKey
ALTER TABLE "tracks"
    DROP CONSTRAINT "tracks_songId_fkey";

-- DropForeignKey
ALTER TABLE "tracks"
    DROP CONSTRAINT "tracks_videoId_fkey";

-- AddForeignKey
ALTER TABLE "videos"
    ADD CONSTRAINT "videos_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos"
    ADD CONSTRAINT "videos_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "song_groups" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks"
    ADD CONSTRAINT "tracks_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks"
    ADD CONSTRAINT "tracks_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

