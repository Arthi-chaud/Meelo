-- DropForeignKey
ALTER TABLE "lyrics" DROP CONSTRAINT "lyrics_songId_fkey";

-- AddForeignKey
ALTER TABLE "lyrics" ADD CONSTRAINT "lyrics_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
