-- AlterTable
ALTER TABLE "artist_illustrations" ADD COLUMN     "aspectRatio" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "playlist_illustrations" ADD COLUMN     "aspectRatio" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "release_illustrations" ADD COLUMN     "aspectRatio" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "track_illustrations" ADD COLUMN     "aspectRatio" DOUBLE PRECISION NOT NULL DEFAULT 1;
