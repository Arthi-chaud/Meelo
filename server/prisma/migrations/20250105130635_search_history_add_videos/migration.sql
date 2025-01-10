/*
  Warnings:

  - A unique constraint covering the columns `[songId,albumId,artistId,videoId,userId]` on the table `search_history` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "search_history_songId_albumId_artistId_userId_key";

-- AlterTable
ALTER TABLE "search_history" ADD COLUMN     "videoId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "search_history_songId_albumId_artistId_videoId_userId_key" ON "search_history"("songId", "albumId", "artistId", "videoId", "userId");

-- AddForeignKey
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
