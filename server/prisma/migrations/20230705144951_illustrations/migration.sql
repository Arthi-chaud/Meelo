-- CreateTable
CREATE TABLE "artist_illustrations" (
    "id" SERIAL NOT NULL,
    "artistId" INTEGER NOT NULL,
    "blurhash" TEXT NOT NULL,
    "colors" TEXT[],

    CONSTRAINT "artist_illustrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_illustrations" (
    "id" SERIAL NOT NULL,
    "playlistId" INTEGER NOT NULL,
    "blurhash" TEXT NOT NULL,
    "colors" TEXT[],

    CONSTRAINT "playlist_illustrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_illustrations" (
    "id" SERIAL NOT NULL,
    "releaseId" INTEGER NOT NULL,
    "disc" INTEGER,
    "blurhash" TEXT NOT NULL,
    "colors" TEXT[],

    CONSTRAINT "release_illustrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track_illustrations" (
    "id" SERIAL NOT NULL,
    "trackId" INTEGER NOT NULL,
    "blurhash" TEXT NOT NULL,
    "colors" TEXT[],

    CONSTRAINT "track_illustrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "artist_illustrations_artistId_key" ON "artist_illustrations"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_illustrations_playlistId_key" ON "playlist_illustrations"("playlistId");

-- CreateIndex
CREATE UNIQUE INDEX "track_illustrations_trackId_key" ON "track_illustrations"("trackId");

-- AddForeignKey
ALTER TABLE "artist_illustrations" ADD CONSTRAINT "artist_illustrations_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_illustrations" ADD CONSTRAINT "playlist_illustrations_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_illustrations" ADD CONSTRAINT "release_illustrations_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_illustrations" ADD CONSTRAINT "track_illustrations_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
