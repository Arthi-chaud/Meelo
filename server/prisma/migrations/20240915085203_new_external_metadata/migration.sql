/*
  Warnings:

  - You are about to drop the `album_external_ids` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `artist_external_ids` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `release_external_ids` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `song_external_ids` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "IllustrationType" ADD VALUE 'Icon';

-- DropForeignKey
ALTER TABLE "album_external_ids" DROP CONSTRAINT "album_external_ids_albumId_fkey";

-- DropForeignKey
ALTER TABLE "album_external_ids" DROP CONSTRAINT "album_external_ids_providerId_fkey";

-- DropForeignKey
ALTER TABLE "artist_external_ids" DROP CONSTRAINT "artist_external_ids_artistId_fkey";

-- DropForeignKey
ALTER TABLE "artist_external_ids" DROP CONSTRAINT "artist_external_ids_providerId_fkey";

-- DropForeignKey
ALTER TABLE "release_external_ids" DROP CONSTRAINT "release_external_ids_providerId_fkey";

-- DropForeignKey
ALTER TABLE "release_external_ids" DROP CONSTRAINT "release_external_ids_releaseId_fkey";

-- DropForeignKey
ALTER TABLE "song_external_ids" DROP CONSTRAINT "song_external_ids_providerId_fkey";

-- DropForeignKey
ALTER TABLE "song_external_ids" DROP CONSTRAINT "song_external_ids_songId_fkey";

-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "illustrationId" INTEGER;

-- DropTable
DROP TABLE "album_external_ids";

-- DropTable
DROP TABLE "artist_external_ids";

-- DropTable
DROP TABLE "release_external_ids";

-- DropTable
DROP TABLE "song_external_ids";

-- CreateTable
CREATE TABLE "external_metadata" (
    "id" SERIAL NOT NULL,
    "description" TEXT,
    "rating" INTEGER,
    "songId" INTEGER,
    "artistId" INTEGER,
    "albumId" INTEGER,
    "releaseId" INTEGER,

    CONSTRAINT "external_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_metadata_sources" (
    "id" SERIAL NOT NULL,
    "providerId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "externalMetadataId" INTEGER NOT NULL,

    CONSTRAINT "external_metadata_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "external_metadata_songId_key" ON "external_metadata"("songId");

-- CreateIndex
CREATE UNIQUE INDEX "external_metadata_artistId_key" ON "external_metadata"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "external_metadata_albumId_key" ON "external_metadata"("albumId");

-- CreateIndex
CREATE UNIQUE INDEX "external_metadata_releaseId_key" ON "external_metadata"("releaseId");

-- CreateIndex
CREATE UNIQUE INDEX "external_metadata_sources_providerId_externalMetadataId_key" ON "external_metadata_sources"("providerId", "externalMetadataId");

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_illustrationId_fkey" FOREIGN KEY ("illustrationId") REFERENCES "illustrations"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_metadata" ADD CONSTRAINT "external_metadata_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_metadata" ADD CONSTRAINT "external_metadata_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_metadata" ADD CONSTRAINT "external_metadata_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_metadata" ADD CONSTRAINT "external_metadata_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_metadata_sources" ADD CONSTRAINT "external_metadata_sources_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_metadata_sources" ADD CONSTRAINT "external_metadata_sources_externalMetadataId_fkey" FOREIGN KEY ("externalMetadataId") REFERENCES "external_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;
