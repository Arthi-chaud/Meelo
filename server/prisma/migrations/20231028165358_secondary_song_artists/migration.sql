-- CreateTable
CREATE TABLE "_ArtistToSong" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ArtistToSong_AB_unique" ON "_ArtistToSong"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtistToSong_B_index" ON "_ArtistToSong"("B");

-- AddForeignKey
ALTER TABLE "_ArtistToSong" ADD CONSTRAINT "_ArtistToSong_A_fkey" FOREIGN KEY ("A") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToSong" ADD CONSTRAINT "_ArtistToSong_B_fkey" FOREIGN KEY ("B") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
