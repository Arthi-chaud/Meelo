/*
  Warnings:

  - You are about to drop the `artist_illustrations` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[illustrationId]` on the table `artists` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "IllustrationType" AS ENUM ('Cover', 'Avatar', 'Thumbnail');

-- DropForeignKey
ALTER TABLE "artist_illustrations" DROP CONSTRAINT "artist_illustrations_artistId_fkey";

-- AlterTable
ALTER TABLE "artists" ADD COLUMN     "illustrationId" INTEGER;

-- DropTable
DROP TABLE "artist_illustrations";

-- CreateTable
CREATE TABLE "illustrations" (
    "id" SERIAL NOT NULL,
    "blurhash" TEXT NOT NULL,
    "colors" TEXT[],
    "aspectRatio" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "type" "IllustrationType" NOT NULL,

    CONSTRAINT "illustrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "artists_illustrationId_key" ON "artists"("illustrationId");

-- AddForeignKey
ALTER TABLE "artists" ADD CONSTRAINT "artists_illustrationId_fkey" FOREIGN KEY ("illustrationId") REFERENCES "illustrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
