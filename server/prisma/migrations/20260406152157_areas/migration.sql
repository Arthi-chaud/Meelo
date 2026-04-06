-- CreateEnum
CREATE TYPE "AreaType" AS ENUM ('Country', 'Subdivision', 'County', 'Municipality', 'City', 'District', 'Island');

-- AlterTable
ALTER TABLE "artists" ADD COLUMN     "activityAreaId" INTEGER,
ADD COLUMN     "birthAreaId" INTEGER;

-- AlterTable
ALTER TABLE "labels" ADD COLUMN     "areaId" INTEGER;

-- CreateTable
CREATE TABLE "areas" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mbid" TEXT NOT NULL,
    "sortName" TEXT NOT NULL,
    "sortSlug" TEXT NOT NULL,
    "iso3166" TEXT,
    "type" "AreaType",
    "parentId" INTEGER,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "areas_mbid_key" ON "areas"("mbid");

-- AddForeignKey
ALTER TABLE "artists" ADD CONSTRAINT "artists_activityAreaId_fkey" FOREIGN KEY ("activityAreaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artists" ADD CONSTRAINT "artists_birthAreaId_fkey" FOREIGN KEY ("birthAreaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
