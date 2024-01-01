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

import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import type { RequireAtLeastOne, RequireExactlyOne } from "type-fest";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import { Song, SongVersion } from "src/prisma/models";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";
import SongQueryParameters from "src/song/models/song.query-params";
import Slug from "src/slug/slug";
import { SongType } from "@prisma/client";
import LibraryQueryParameters from "src/library/models/library.query-parameters";
import AlbumQueryParameters from "src/album/models/album.query-parameters";

namespace SongVersionQueryParameters {
	/**
	 * The input required to save a song version in the database
	 */
	export type CreateInput = Omit<
		SongVersion,
		"slug" | "id" | "masterId" | "songId"
	> & {
		song: { id: number };
		featuring?: RequireExactlyOne<
			Pick<ArtistQueryParameters.WhereInput, "slug">
		>[];
	};

	/**
	 * Query paraeters to find a song version
	 */
	export type WhereInput = RequireExactlyOne<{
		id: SongVersion["id"];
		bySlug: {
			slug: Slug;
			song: { id: number };
		};
	}>;

	/**
	 * Query paraeters to find a song version to update
	 */
	export type UpdateWhereInput = RequireExactlyOne<{
		id: SongVersion["id"];
	}>;

	/**
	 * Query params to find multiple song versions
	 */
	export type ManyWhereInput = Partial<
		RequireAtLeastOne<{
			song: SongQueryParameters.WhereInput;
			id: { in: number[] };
			type: SongType;
			library: LibraryQueryParameters.WhereInput;
			artist: ArtistQueryParameters.WhereInput;
			album: AlbumQueryParameters.WhereInput;
		}>
	>;

	/**
	 * The input required to update a song version in the database
	 */
	export type UpdateInput = Partial<CreateInput>;

	export type DeleteInput = {
		id: Song["id"];
	};
	/**
	 * The input to find or create a song version
	 */
	export type GetOrCreateInput = CreateInput;
	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ["song", "tracks", "featuring"] as const;
	export const AvailableAtomicIncludes = filterAtomicRelationInclude(
		AvailableIncludes,
		["tracks", "externalIds"],
	);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = ["id", "name", "slug"] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default SongVersionQueryParameters;
