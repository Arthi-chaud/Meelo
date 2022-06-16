/*
  Warnings:

  - Made the column `title` on table `Release` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Release" ALTER COLUMN "title" SET NOT NULL;
