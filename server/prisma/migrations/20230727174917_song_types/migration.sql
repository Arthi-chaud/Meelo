-- CreateEnum
CREATE TYPE "song-types" AS ENUM ('Original', 'Live', 'Acoustic', 'Remix', 'Instrumental', 'Edit', 'Clean', 'Demo', 'Unknown');

-- AlterTable
ALTER TABLE "songs" ADD COLUMN     "type" "song-types" NOT NULL DEFAULT 'Unknown';
