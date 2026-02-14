-- CreateTable
CREATE TABLE "playlists" (
    "id" SERIAL NOT NULL,
    "name" CITEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_entries" (
    "id" SERIAL NOT NULL,
    "songId" INTEGER NOT NULL,
    "playlistId" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,

    CONSTRAINT "playlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "playlists_slug_key" ON "playlists"("slug");

-- AddForeignKey
ALTER TABLE "playlist_entries" ADD CONSTRAINT "playlist_entries_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_entries" ADD CONSTRAINT "playlist_entries_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
