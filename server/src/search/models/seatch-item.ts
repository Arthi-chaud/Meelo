import type {
	Album,
	Artist,
	Genre,
	Label,
	Song,
	Video,
} from "src/prisma/models";

export type SearchItem =
	| { type: "artist"; item: Artist }
	| { type: "album"; item: Album }
	| { type: "song"; item: Song }
	| { type: "video"; item: Video }
	| { type: "label"; item: Label }
	| { type: "genre"; item: Genre };

export type SearchHistoryItem = SearchItem;

export function toSearchItem(
	item: Artist | Album | Song | Video | Label,
): SearchItem {
	if ("startDate" in item) {
		return { type: "label", item };
	}
	if ("groupId" in item) {
		if ("songId" in item) {
			return { type: "video", item };
		}
		return { type: "song", item };
	}
	if ("masterId" in item) {
		return { type: "album", item };
	}
	if ("birthAreaId" in item) {
		return { type: "artist", item };
	}
	return { type: "genre", item };
}
