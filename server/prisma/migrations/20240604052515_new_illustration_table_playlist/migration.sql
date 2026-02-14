/*
  Warnings:

  - You are about to drop the `playlist_illustrations` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[illustrationId]` on the table `playlists` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "playlist_illustrations" DROP CONSTRAINT "playlist_illustrations_playlistId_fkey";

-- AlterTable
ALTER TABLE "playlists" ADD COLUMN     "illustrationId" INTEGER;

-- DropTable
DROP TABLE "playlist_illustrations";

-- CreateIndex
CREATE UNIQUE INDEX "playlists_illustrationId_key" ON "playlists"("illustrationId");

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_illustrationId_fkey" FOREIGN KEY ("illustrationId") REFERENCES "illustrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
