/*
  Warnings:

  - Added the required column `allowChanges` to the `playlists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isPublic` to the `playlists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `playlists` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "playlists" ADD COLUMN     "allowChanges" BOOLEAN NOT NULL,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL,
ADD COLUMN     "ownerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
