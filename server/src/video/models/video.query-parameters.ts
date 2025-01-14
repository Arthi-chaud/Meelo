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

import { VideoType } from "@prisma/client";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";
import Slug from "src/slug/slug";
import SongQueryParameters from "src/song/models/song.query-params";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import { RequireAtLeastOne, RequireExactlyOne } from "type-fest";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import SongGroupQueryParameters from "src/song/models/song-group.query-params";
import { SearchStringInput } from "src/utils/search-string-input";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import TrackQueryParameters from "src/track/models/track.query-parameters";

namespace VideoQueryParameters {
	export type CreateInput = {
		name: string;
		registeredAt?: Date;
		artist: ArtistQueryParameters.WhereInput;
		song?: SongQueryParameters.WhereInput;
		group?: SongGroupQueryParameters.GetOrCreateInput;
		type?: VideoType;
	};
	export type UpdateInput = Partial<{
		song: SongQueryParameters.WhereInput;
		master: TrackQueryParameters.WhereInput | null;
		type: VideoType;
	}>;
	export type WhereInput = RequireExactlyOne<{
		id: number;
		slug: Slug;
	}>;

	/**
	 * Query params to find multiple songs
	 */
	export type ManyWhereInput = Partial<
		RequireAtLeastOne<{
			name: SearchStringInput;
			album: AlbumQueryParameters.WhereInput;
			artist?: ArtistQueryParameters.WhereInput;
			library: AlbumQueryParameters.WhereInput;
			group: SongGroupQueryParameters.WhereInput;
			song: SongQueryParameters.WhereInput;
			type?: VideoType;
			videos: VideoQueryParameters.WhereInput[];
		}>
	>;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = [
		"tracks",
		"artist",
		"song",
		"master",
		"illustration",
	] as const;
	export const AvailableAtomicIncludes = filterAtomicRelationInclude(
		AvailableIncludes,
		[],
	);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = ["id", "name", "artistName", "addDate"] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default VideoQueryParameters;
