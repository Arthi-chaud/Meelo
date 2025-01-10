-- CreateEnum
CREATE TYPE "video-types" AS ENUM (
    'MusicVideo',
    'LyricsVideo',
    'Live',
    'BehindTheScenes',
    'Interview',
    'Advert',
    'PhotoGallery',
    'Documentary',
    'Other'
);

-- DropForeignKey
ALTER TABLE "tracks"
    DROP CONSTRAINT "tracks_songId_fkey";

-- AlterTable
ALTER TABLE "tracks"
    ADD COLUMN "videoId" INTEGER,
    ALTER COLUMN "songId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "videos" (
    "id" serial NOT NULL,
    "slug" text NOT NULL,
    "nameSlug" text NOT NULL,
    "name" text NOT NULL,
    "artistId" integer NOT NULL,
    "songId" integer,
    "groupId" integer,
    "type" "video-types" NOT NULL,
    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "videos_slug_key" ON "videos" ("slug");

-- AddForeignKey
ALTER TABLE "videos"
    ADD CONSTRAINT "videos_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos"
    ADD CONSTRAINT "videos_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos"
    ADD CONSTRAINT "videos_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "song_groups" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks"
    ADD CONSTRAINT "tracks_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks"
    ADD CONSTRAINT "tracks_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

