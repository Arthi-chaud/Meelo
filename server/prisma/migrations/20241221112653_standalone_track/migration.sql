-- DropForeignKey
ALTER TABLE "tracks" DROP CONSTRAINT "tracks_releaseId_fkey";

-- AlterTable
ALTER TABLE "tracks" ALTER COLUMN "releaseId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
