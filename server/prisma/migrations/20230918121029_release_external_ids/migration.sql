-- CreateTable
CREATE TABLE "release_external_ids" (
    "id" SERIAL NOT NULL,
    "releaseId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "release_external_ids_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "release_external_ids" ADD CONSTRAINT "release_external_ids_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_external_ids" ADD CONSTRAINT "release_external_ids_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
