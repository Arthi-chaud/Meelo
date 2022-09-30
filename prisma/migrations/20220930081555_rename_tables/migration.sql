/*
  Warnings:

  - You are about to drop the `Album` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Artist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Genre` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Library` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lyrics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Release` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Song` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Track` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Album" DROP CONSTRAINT "Album_artistId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_libraryId_fkey";

-- DropForeignKey
ALTER TABLE "Lyrics" DROP CONSTRAINT "Lyrics_songId_fkey";

-- DropForeignKey
ALTER TABLE "Release" DROP CONSTRAINT "Release_albumId_fkey";

-- DropForeignKey
ALTER TABLE "Song" DROP CONSTRAINT "Song_artistId_fkey";

-- DropForeignKey
ALTER TABLE "Track" DROP CONSTRAINT "Track_releaseId_fkey";

-- DropForeignKey
ALTER TABLE "Track" DROP CONSTRAINT "Track_songId_fkey";

-- DropForeignKey
ALTER TABLE "Track" DROP CONSTRAINT "Track_sourceFileId_fkey";

-- DropForeignKey
ALTER TABLE "_GenreToSong" DROP CONSTRAINT "_GenreToSong_A_fkey";

-- DropForeignKey
ALTER TABLE "_GenreToSong" DROP CONSTRAINT "_GenreToSong_B_fkey";

-- DropTable
DROP TABLE "Album";

-- DropTable
DROP TABLE "Artist";

-- DropTable
DROP TABLE "File";

-- DropTable
DROP TABLE "Genre";

-- DropTable
DROP TABLE "Library";

-- DropTable
DROP TABLE "Lyrics";

-- DropTable
DROP TABLE "Release";

-- DropTable
DROP TABLE "Song";

-- DropTable
DROP TABLE "Track";

-- CreateTable
CREATE TABLE "genres" (
    "id" SERIAL NOT NULL,
    "name" CITEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" SERIAL NOT NULL,
    "name" CITEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "type" "AlbumType" NOT NULL DEFAULT E'StudioRecording',
    "artistId" INTEGER,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artists" (
    "id" SERIAL NOT NULL,
    "name" CITEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "md5Checksum" TEXT NOT NULL,
    "registerDate" TIMESTAMP(3) NOT NULL,
    "libraryId" INTEGER NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "libraries" (
    "id" SERIAL NOT NULL,
    "name" CITEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "path" TEXT NOT NULL,

    CONSTRAINT "libraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "releases" (
    "id" SERIAL NOT NULL,
    "name" CITEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "master" BOOLEAN NOT NULL DEFAULT false,
    "albumId" INTEGER NOT NULL,

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs" (
    "id" SERIAL NOT NULL,
    "name" CITEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "artistId" INTEGER NOT NULL,
    "playCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lyrics" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "songId" INTEGER NOT NULL,

    CONSTRAINT "lyrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" SERIAL NOT NULL,
    "songId" INTEGER NOT NULL,
    "releaseId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "master" BOOLEAN NOT NULL DEFAULT false,
    "discIndex" INTEGER,
    "trackIndex" INTEGER,
    "type" "TrackType" NOT NULL,
    "bitrate" INTEGER NOT NULL,
    "ripSource" "RipSource",
    "duration" INTEGER NOT NULL,
    "sourceFileId" INTEGER NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "genres_slug_key" ON "genres"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "albums_slug_artistId_key" ON "albums"("slug", "artistId");

-- CreateIndex
CREATE UNIQUE INDEX "artists_slug_key" ON "artists"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "files_path_libraryId_key" ON "files"("path", "libraryId");

-- CreateIndex
CREATE UNIQUE INDEX "libraries_name_key" ON "libraries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "libraries_slug_key" ON "libraries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "libraries_path_key" ON "libraries"("path");

-- CreateIndex
CREATE UNIQUE INDEX "releases_albumId_slug_key" ON "releases"("albumId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "songs_slug_artistId_key" ON "songs"("slug", "artistId");

-- CreateIndex
CREATE UNIQUE INDEX "lyrics_songId_key" ON "lyrics"("songId");

-- CreateIndex
CREATE UNIQUE INDEX "tracks_sourceFileId_key" ON "tracks"("sourceFileId");

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "libraries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lyrics" ADD CONSTRAINT "lyrics_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToSong" ADD CONSTRAINT "_GenreToSong_A_fkey" FOREIGN KEY ("A") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToSong" ADD CONSTRAINT "_GenreToSong_B_fkey" FOREIGN KEY ("B") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
