-- CreateEnum
CREATE TYPE "scrobblers" AS ENUM (
    'LastFM',
    'ListenBrainz'
);

-- CreateTable
CREATE TABLE "user_scrobbler" (
    "userId" integer NOT NULL,
    "lastScrobblingDate" timestamp(3),
    "scrobbler" "scrobblers" NOT NULL,
    "data" jsonb NOT NULL,
    CONSTRAINT "user_scrobbler_pkey" PRIMARY KEY ("scrobbler", "userId")
);

-- AddForeignKey
ALTER TABLE "user_scrobbler"
    ADD CONSTRAINT "user_scrobbler_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

