-- CreateTable
CREATE TABLE "providers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_external_ids" (
    "id" SERIAL NOT NULL,
    "songId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "song_external_ids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_external_ids" (
    "id" SERIAL NOT NULL,
    "artistId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "artist_external_ids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album_external_ids" (
    "id" SERIAL NOT NULL,
    "albumId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "album_external_ids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_name_key" ON "providers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "providers_slug_key" ON "providers"("slug");

-- AddForeignKey
ALTER TABLE "song_external_ids" ADD CONSTRAINT "song_external_ids_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_external_ids" ADD CONSTRAINT "song_external_ids_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_external_ids" ADD CONSTRAINT "artist_external_ids_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_external_ids" ADD CONSTRAINT "artist_external_ids_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_external_ids" ADD CONSTRAINT "album_external_ids_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_external_ids" ADD CONSTRAINT "album_external_ids_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
