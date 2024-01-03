/*
  Warnings:

  - Added the required column `groupId` to the `songs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "songs" ADD COLUMN     "groupId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "song_groups" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "song_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "song_groups_slug_key" ON "song_groups"("slug");

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "song_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
