-- AlterTable
ALTER TABLE "album_external_ids" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "artist_external_ids" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "release_external_ids" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "song_external_ids" ADD COLUMN     "description" TEXT;
