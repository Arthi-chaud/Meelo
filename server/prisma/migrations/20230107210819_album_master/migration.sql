/*
  Warnings:

  - You are about to drop the column `master` on the `releases` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[masterId]` on the table `albums` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "albums" ADD COLUMN     "masterId" INTEGER;

-- AlterTable
ALTER TABLE "releases" DROP COLUMN "master";

-- CreateIndex
CREATE UNIQUE INDEX "albums_masterId_key" ON "albums"("masterId");

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
