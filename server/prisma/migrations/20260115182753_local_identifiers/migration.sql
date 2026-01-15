-- CreateTable
CREATE TABLE "local_identifiers" (
    "id" SERIAL NOT NULL,
    "musicbrainzId" TEXT,
    "discogsId" TEXT,
    "songId" INTEGER,
    "artistId" INTEGER,
    "albumId" INTEGER,
    "releaseId" INTEGER,

    CONSTRAINT "local_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "local_identifiers_songId_key" ON "local_identifiers"("songId");

-- CreateIndex
CREATE UNIQUE INDEX "local_identifiers_artistId_key" ON "local_identifiers"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "local_identifiers_albumId_key" ON "local_identifiers"("albumId");

-- CreateIndex
CREATE UNIQUE INDEX "local_identifiers_releaseId_key" ON "local_identifiers"("releaseId");

-- AddForeignKey
ALTER TABLE "local_identifiers" ADD CONSTRAINT "local_identifiers_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_identifiers" ADD CONSTRAINT "local_identifiers_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_identifiers" ADD CONSTRAINT "local_identifiers_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_identifiers" ADD CONSTRAINT "local_identifiers_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
