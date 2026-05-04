-- AlterTable
ALTER TABLE "releases" ADD COLUMN "isFirstRegistered" BOOLEAN NOT NULL DEFAULT false;

UPDATE "releases" r
	SET "isFirstRegistered" = (date_trunc('seconds', r."registeredAt")) = (date_trunc('seconds',a."registeredAt"))
	FROM "albums" a 
	WHERE a.id = r."albumId";

ALTER TABLE "releases" ALTER COLUMN "isFirstRegistered" DROP DEFAULT;
