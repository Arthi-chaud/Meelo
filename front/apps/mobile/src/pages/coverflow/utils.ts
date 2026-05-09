import type { AlbumWithRelations } from "@/models/album";

export type AlbumT = AlbumWithRelations<"artists" | "illustration">;
