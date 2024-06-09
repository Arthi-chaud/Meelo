/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `albums` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `releases` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `songs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nameSlug` to the `albums` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameSlug` to the `releases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameSlug` to the `songs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "albums" ADD COLUMN     "nameSlug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "releases" ADD COLUMN     "nameSlug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "songs" ADD COLUMN     "nameSlug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "albums_slug_key" ON "albums"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "releases_slug_key" ON "releases"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "songs_slug_key" ON "songs"("slug");
