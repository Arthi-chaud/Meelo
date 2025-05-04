-- AlterTable
ALTER TABLE "releases" ADD COLUMN     "labelId" INTEGER;

-- CreateTable
CREATE TABLE "labels" (
    "id" SERIAL NOT NULL,
    "name" CITEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "labels_slug_key" ON "labels"("slug");

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
