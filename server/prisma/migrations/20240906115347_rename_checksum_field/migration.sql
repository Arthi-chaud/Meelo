/*
  Warnings:

  - You are about to drop the column `md5Checksum` on the `files` table. All the data in the column will be lost.
  - Added the required column `checksum` to the `files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "files" DROP COLUMN "md5Checksum",
ADD COLUMN     "checksum" TEXT NOT NULL;
