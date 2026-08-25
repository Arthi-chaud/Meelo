-- CreateTable
CREATE TABLE "series" (
    "id" SERIAL NOT NULL,
    "name" CITEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "mbid" TEXT,
    "labelId" INTEGER,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series_entry" (
    "id" SERIAL NOT NULL,
    "albumId" INTEGER NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "index" DOUBLE PRECISION,

    CONSTRAINT "series_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "series_slug_key" ON "series"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "series_mbid_key" ON "series"("mbid");

-- CreateIndex
CREATE UNIQUE INDEX "series_entry_albumId_key" ON "series_entry"("albumId");

-- CreateIndex
CREATE UNIQUE INDEX "series_entry_seriesId_albumId_key" ON "series_entry"("seriesId", "albumId");

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "series_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_entry" ADD CONSTRAINT "series_entry_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_entry" ADD CONSTRAINT "series_entry_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE VIEW "series_album_view" AS
SELECT
    s.*,
	e."index" AS "index",
	e."albumId" AS "albumId"
FROM
    series s
    JOIN series_entry e ON e."seriesId" = s.id;
