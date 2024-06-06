/*
  Warnings:

  - You are about to drop the `release_illustrations` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `releaseIllustrationId` to the `illustrations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "release_illustrations" DROP CONSTRAINT "release_illustrations_releaseId_fkey";

-- DropTable
DROP TABLE "release_illustrations";

-- CreateTable
CREATE TABLE "release_illustrations" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,
    "releaseId" INTEGER NOT NULL,
    "disc" INTEGER,
    "track" INTEGER,
    "illustrationId" INTEGER NOT NULL,

    CONSTRAINT "release_illustrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "release_illustrations_illustrationId_key" ON "release_illustrations"("illustrationId");

-- CreateIndex
CREATE UNIQUE INDEX "release_illustrations_releaseId_disc_track_key" ON "release_illustrations"("releaseId", "disc", "track");

-- AddForeignKey
ALTER TABLE "release_illustrations" ADD CONSTRAINT "release_illustrations_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_illustrations" ADD CONSTRAINT "release_illustrations_illustrationId_fkey" FOREIGN KEY ("illustrationId") REFERENCES "illustrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
