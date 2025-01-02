-- CreateEnum
CREATE TYPE "video-types" AS ENUM ('MusicVideo', 'LyricsVideo', 'Live', 'BehindTheScenes', 'Interview', 'Advert', 'PhotoGallery', 'Documentary', 'Other');

-- DropForeignKey
ALTER TABLE "tracks" DROP CONSTRAINT "tracks_songId_fkey";

-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "videoId" INTEGER,
ALTER COLUMN "songId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "nameSlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artistId" INTEGER NOT NULL,
    "songId" INTEGER,
    "groupId" INTEGER,
    "type" "video-types" NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Video_slug_key" ON "Video"("slug");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "song_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;
