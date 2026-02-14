/*
  Warnings:

  - You are about to drop the column `playCount` on the `songs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "songs" DROP COLUMN "playCount";

-- CreateTable
CREATE TABLE "play_history" (
    "id" SERIAL NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "songId" INTEGER NOT NULL,

    CONSTRAINT "play_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
