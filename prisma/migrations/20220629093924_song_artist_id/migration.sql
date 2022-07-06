/*
  Warnings:

  - Made the column `artistId` on table `Song` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Song" ALTER COLUMN "artistId" SET NOT NULL;
