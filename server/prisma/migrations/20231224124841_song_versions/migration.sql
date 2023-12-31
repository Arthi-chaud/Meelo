/*
  Warnings:

  - You are about to drop the column `masterId` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `ripSource` on the `tracks` table. All the data in the column will be lost.
  - You are about to drop the column `songId` on the `tracks` table. All the data in the column will be lost.
  - You are about to drop the `_ArtistToSong` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[mainVersionId]` on the table `songs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `songVersionId` to the `tracks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_ArtistToSong" DROP CONSTRAINT "_ArtistToSong_A_fkey";

-- DropForeignKey
ALTER TABLE "_ArtistToSong" DROP CONSTRAINT "_ArtistToSong_B_fkey";

-- DropForeignKey
ALTER TABLE "playlist_entries" DROP CONSTRAINT "playlist_entries_songId_fkey";

-- DropForeignKey
ALTER TABLE "songs" DROP CONSTRAINT "songs_masterId_fkey";

-- DropForeignKey
ALTER TABLE "tracks" DROP CONSTRAINT "tracks_songId_fkey";

-- DropIndex
DROP INDEX "songs_masterId_key";

-- AlterTable
ALTER TABLE "albums" ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "songs" DROP COLUMN "masterId",
DROP COLUMN "type",
ADD COLUMN     "mainVersionId" INTEGER;

-- AlterTable
ALTER TABLE "tracks" DROP COLUMN "ripSource",
DROP COLUMN "songId",
ADD COLUMN     "songVersionId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_ArtistToSong";

-- DropEnum
DROP TYPE "rip-sources";

-- CreateTable
CREATE TABLE "song_versions" (
    "id" SERIAL NOT NULL,
    "name" CITEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "songId" INTEGER NOT NULL,
    "masterId" INTEGER,
    "type" "song-types" NOT NULL DEFAULT 'Unknown',

    CONSTRAINT "song_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_song_version_featuring" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "song_versions_masterId_key" ON "song_versions"("masterId");

-- CreateIndex
CREATE UNIQUE INDEX "_song_version_featuring_AB_unique" ON "_song_version_featuring"("A", "B");

-- CreateIndex
CREATE INDEX "_song_version_featuring_B_index" ON "_song_version_featuring"("B");

-- CreateIndex
CREATE UNIQUE INDEX "songs_mainVersionId_key" ON "songs"("mainVersionId");

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_mainVersionId_fkey" FOREIGN KEY ("mainVersionId") REFERENCES "song_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_versions" ADD CONSTRAINT "song_versions_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_versions" ADD CONSTRAINT "song_versions_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_songVersionId_fkey" FOREIGN KEY ("songVersionId") REFERENCES "song_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_entries" ADD CONSTRAINT "playlist_entries_songId_fkey" FOREIGN KEY ("songId") REFERENCES "song_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_song_version_featuring" ADD CONSTRAINT "_song_version_featuring_A_fkey" FOREIGN KEY ("A") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_song_version_featuring" ADD CONSTRAINT "_song_version_featuring_B_fkey" FOREIGN KEY ("B") REFERENCES "song_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "song_versions_songId_slug_key" ON "song_versions"("songId", "slug");

-- DropForeignKey
ALTER TABLE "playlist_entries" DROP CONSTRAINT "playlist_entries_songId_fkey";

-- AlterTable
ALTER TABLE "playlist_entries" DROP COLUMN "songId",
ADD COLUMN     "songVersionId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "playlist_entries" ADD CONSTRAINT "playlist_entries_songVersionId_fkey" FOREIGN KEY ("songVersionId") REFERENCES "song_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
