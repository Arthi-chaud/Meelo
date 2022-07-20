/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Genre` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");
