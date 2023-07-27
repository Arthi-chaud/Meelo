/*
  Warnings:

  - Added the required column `type` to the `songs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "song-types" AS ENUM ('Original', 'Live', 'Acoustic', 'Remix', 'Instrumental', 'Edit', 'Clean', 'Demo');

-- AlterTable
ALTER TABLE "songs" ADD COLUMN     "type" "song-types" NOT NULL;
