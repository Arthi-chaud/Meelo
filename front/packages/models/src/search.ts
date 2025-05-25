/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import type { RequireExactlyOne } from "type-fest";
import { AlbumWithRelations } from "./album";
import { ArtistWithRelations } from "./artist";
import { SongWithRelations } from "./song";
import { VideoWithRelations } from "./video";

export type SearchResult = RequireExactlyOne<{
	song: SongWithRelations<"artist" | "featuring" | "illustration" | "master">;
	album: AlbumWithRelations<"artist" | "illustration">;
	artist: ArtistWithRelations<"illustration">;
	video: VideoWithRelations<"illustration" | "master" | "artist">;
}>;

export type SaveSearchItem = Partial<
	Record<"songId" | "albumId" | "artistId" | "videoId", number>
>;
export const SearchResultTransformer = (
	results: unknown,
): Promise<SearchResult[]> => {
	if (!Array.isArray(results)) {
		throw new Error("Search result is not an array");
	}
	return Promise.all(
		results.map(async (result) => {
			if ("groupId" in result) {
				if ("songId" in result) {
					return {
						video: await VideoWithRelations([
							"artist",
							"illustration",
							"master",
						] as const).validate(result),
					};
				}
				return {
					song: await SongWithRelations([
						"artist",
						"featuring",
						"illustration",
						"master",
					] as const).validate(result),
				};
			}
			if ("masterId" in result) {
				return {
					album: await AlbumWithRelations([
						"artist",
						"illustration",
					] as const).validate(result),
				};
			}
			return {
				artist: await ArtistWithRelations([
					"illustration",
				] as const).validate(result),
			};
		}),
	);
};
