-- AlterTable
ALTER TABLE "search_history" ADD COLUMN     "labelId" INTEGER;

-- AddForeignKey
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
