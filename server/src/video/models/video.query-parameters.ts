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

import type { VideoType } from "@prisma/client";
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { EnumFilter, Filter } from "src/filter/filter";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import type Slug from "src/slug/slug";
import type SongQueryParameters from "src/song/models/song.query-params";
import type SongGroupQueryParameters from "src/song/models/song-group.query-params";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import type TrackQueryParameters from "src/track/models/track.query-parameters";
import type { SearchStringInput } from "src/utils/search-string-input";
import type { RequireAtLeastOne, RequireExactlyOne } from "type-fest";

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
			artist?: Filter<ArtistQueryParameters.WhereInput>;
			library: Filter<AlbumQueryParameters.WhereInput>;
			group: SongGroupQueryParameters.WhereInput;
			song: Filter<SongQueryParameters.WhereInput>;
			type?: EnumFilter<VideoType>;
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
	export const SortingKeys = [
		"id",
		"name",
		"artistName",
		"addDate",
		"releaseDate",
	] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default VideoQueryParameters;
