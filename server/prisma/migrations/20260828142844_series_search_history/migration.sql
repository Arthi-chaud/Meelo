-- AlterTable
ALTER TABLE "search_history" ADD COLUMN     "seriesId" INTEGER;

-- AddForeignKey
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
