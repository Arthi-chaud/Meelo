/*
  Warnings:

  - A unique constraint covering the columns `[path,libraryId]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "File_path_key";

-- CreateIndex
CREATE UNIQUE INDEX "File_path_libraryId_key" ON "File"("path", "libraryId");
