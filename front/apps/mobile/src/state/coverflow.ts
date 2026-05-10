import { atom } from "jotai";
import type { InfiniteQuery } from "@/api/query";
import type { AlbumWithRelations } from "@/models/album";

export const coverflowQueryAtom = atom<InfiniteQuery<
	AlbumWithRelations<"artists" | "illustration">
> | null>(null);
