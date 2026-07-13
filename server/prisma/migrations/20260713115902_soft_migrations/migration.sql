-- CreateTable
CREATE TABLE "soft_migrations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "soft_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "soft_migrations_name_key" ON "soft_migrations"("name");
