-- AlterTable
ALTER TABLE "_AlbumToGenre" ADD CONSTRAINT "_AlbumToGenre_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_AlbumToGenre_AB_unique";

-- AlterTable
ALTER TABLE "_ArtistToSong" ADD CONSTRAINT "_ArtistToSong_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ArtistToSong_AB_unique";

-- AlterTable
ALTER TABLE "_GenreToSong" ADD CONSTRAINT "_GenreToSong_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_GenreToSong_AB_unique";
