import { getSchemaPath } from "@nestjs/swagger";
import { AlbumResponse } from "src/album/models/album.response";
import { ArtistResponse } from "src/artist/models/artist.response";
import {
	Album,
	Artist,
	Genre,
	Label,
	Series,
	type Song,
	type Video,
} from "src/prisma/models";
import { SongResponse } from "src/song/models/song.response";
import { VideoResponse } from "src/video/models/video.response";

export type SearchItem =
	| { type: "artist"; item: Artist }
	| { type: "album"; item: Album }
	| { type: "song"; item: Song }
	| { type: "video"; item: Video }
	| { type: "label"; item: Label }
	| { type: "genre"; item: Genre }
	| { type: "series"; item: Series };

export const SearchItemSchema = {
	type: "array",
	items: {
		oneOf: [
			["artist", ArtistResponse],
			["album", AlbumResponse],
			["song", SongResponse],
			["video", VideoResponse],
			["label", Label],
			["genre", Genre],
			["series", Series],
		].map(([type, model]) => ({
			type: "object",
			properties: {
				type: { type: "string", enum: [type] },
				item: { $ref: getSchemaPath(model as typeof Artist) },
			},
			required: ["type", "item"],
		})),
		discriminator: {
			propertyName: "type",
		},
	},
};

export type SearchHistoryItem = SearchItem;

export function toSearchItem(
	item: Artist | Album | Song | Video | Label | Genre | Series,
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
	if ("mbid" in item) {
		return { type: "series", item };
	}
	return { type: "genre", item };
}
