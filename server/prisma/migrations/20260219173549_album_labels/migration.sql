-- CreateTable
CREATE TABLE "_AlbumToLabel" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AlbumToLabel_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AlbumToLabel_B_index" ON "_AlbumToLabel"("B");

-- AddForeignKey
ALTER TABLE "_AlbumToLabel" ADD CONSTRAINT "_AlbumToLabel_A_fkey" FOREIGN KEY ("A") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToLabel" ADD CONSTRAINT "_AlbumToLabel_B_fkey" FOREIGN KEY ("B") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
