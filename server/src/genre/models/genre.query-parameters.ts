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

import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import type { Genre } from "src/prisma/models";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import type Slug from "src/slug/slug";
import type SongQueryParameters from "src/song/models/song.query-params";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import type { SearchStringInput } from "src/utils/search-string-input";
import type { RequireAtLeastOne, RequireExactlyOne } from "type-fest";

namespace GenreQueryParameters {
	/**
	 * The input required to save a genre in the database
	 */
	export type CreateInput = Omit<Genre, "id" | "slug" | "songs">;

	/**
	 * Query parameters to find one genre
	 */
	export type WhereInput = RequireExactlyOne<{
		id: number;
		slug: Slug;
	}>;

	/**
	 * Query parameters to find multiple genre
	 */
	export type ManyWhereInput = Partial<
		RequireAtLeastOne<{
			song: SongQueryParameters.WhereInput;
			artist: ArtistQueryParameters.WhereInput;
			album: AlbumQueryParameters.WhereInput;
			slug: SearchStringInput;
			genres: GenreQueryParameters.WhereInput[];
		}>
	>;

	/**
	 * The input required to update a genre in the database
	 */
	export type UpdateInput = CreateInput;

	/**
	 * The input to find or create an genre
	 */
	export type GetOrCreateInput = CreateInput;

	/**
	 * Query parameters to delete one genre
	 */
	export type DeleteInput = WhereInput;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ["songs"] as const;
	export const AvailableAtomicIncludes =
		filterAtomicRelationInclude(AvailableIncludes);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = ["id", "name", "songCount"] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default GenreQueryParameters;
