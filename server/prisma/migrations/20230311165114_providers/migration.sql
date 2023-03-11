-- CreateTable
CREATE TABLE "providers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_external_id" (
    "songId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "artist_external_ids" (
    "artistId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "album_external_ids" (
    "albumId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_name_key" ON "providers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "providers_slug_key" ON "providers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "song_external_id_songId_key" ON "song_external_id"("songId");

-- CreateIndex
CREATE UNIQUE INDEX "song_external_id_providerId_key" ON "song_external_id"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "artist_external_ids_artistId_key" ON "artist_external_ids"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "artist_external_ids_providerId_key" ON "artist_external_ids"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "album_external_ids_albumId_key" ON "album_external_ids"("albumId");

-- CreateIndex
CREATE UNIQUE INDEX "album_external_ids_providerId_key" ON "album_external_ids"("providerId");

-- AddForeignKey
ALTER TABLE "song_external_id" ADD CONSTRAINT "song_external_id_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_external_id" ADD CONSTRAINT "song_external_id_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_external_ids" ADD CONSTRAINT "artist_external_ids_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_external_ids" ADD CONSTRAINT "artist_external_ids_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_external_ids" ADD CONSTRAINT "album_external_ids_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_external_ids" ADD CONSTRAINT "album_external_ids_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
