/*
  Warnings:

  - You are about to drop the `track_illustrations` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `hash` to the `release_illustrations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "track_illustrations" DROP CONSTRAINT "track_illustrations_trackId_fkey";

-- AlterTable
ALTER TABLE "release_illustrations" ADD COLUMN     "hash" TEXT NOT NULL;
ALTER TABLE "release_illustrations" ADD COLUMN     "track" INTEGER;
CREATE UNIQUE INDEX "release_illustrations_releaseId_disc_track_key" ON "release_illustrations"("releaseId", "disc", "track");


-- DropTable
DROP TABLE "track_illustrations";
