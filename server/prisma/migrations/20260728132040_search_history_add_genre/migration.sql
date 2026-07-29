-- AlterTable
ALTER TABLE "search_history" ADD COLUMN     "genreId" INTEGER;

-- AddForeignKey
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
