/*
  Warnings:

  - You are about to drop the column `master` on the `tracks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[masterId]` on the table `songs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "songs" ADD COLUMN     "masterId" INTEGER;

-- AlterTable
ALTER TABLE "tracks" DROP COLUMN "master";

-- CreateIndex
CREATE UNIQUE INDEX "songs_masterId_key" ON "songs"("masterId");

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
