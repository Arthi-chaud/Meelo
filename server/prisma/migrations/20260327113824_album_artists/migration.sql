ALTER TABLE "albums" DROP CONSTRAINT "albums_artistId_fkey";
DROP INDEX "albums_slug_artistId_key";

CREATE TABLE "_AlbumToArtist" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AlbumToArtist_AB_pkey" PRIMARY KEY ("A","B")
);

INSERT INTO "_AlbumToArtist" ("A", "B")
SELECT id, "artistId"
FROM "albums"
WHERE "artistId" IS NOT NULL;

ALTER TABLE "albums" DROP COLUMN "artistId";


-- CreateIndex
CREATE INDEX "_AlbumToArtist_B_index" ON "_AlbumToArtist"("B");

-- AddForeignKey
ALTER TABLE "_AlbumToArtist" ADD CONSTRAINT "_AlbumToArtist_A_fkey" FOREIGN KEY ("A") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToArtist" ADD CONSTRAINT "_AlbumToArtist_B_fkey" FOREIGN KEY ("B") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
