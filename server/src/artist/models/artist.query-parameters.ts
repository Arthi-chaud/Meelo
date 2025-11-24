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
import { Filter } from "src/filter/filter";
import type GenreQueryParameters from "src/genre/models/genre.query-parameters";
import LabelQueryParameters from "src/label/label.query-parameters";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import type { Artist } from "src/prisma/models";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import type Slug from "src/slug/slug";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import type { SearchStringInput } from "src/utils/search-string-input";
import type { RequireAtLeastOne, RequireExactlyOne } from "type-fest";

namespace ArtistQueryParameters {
	/**
	 * Parameters to create an Artist
	 */
	export type CreateInput = Omit<
		Artist,
		| "id"
		| "slug"
		| "songs"
		| "albums"
		| "registeredAt"
		| "illustrationId"
		| "sortName"
		| "sortSlug"
	> & {
		registeredAt?: Date;
	};
	/**
	 * Query parameters to find one artist
	 */
	export type WhereInput = RequireExactlyOne<{
		id: number;
		slug: Slug;
		compilationArtist: true;
	}>;

	/**
	 * Query parameters to find multiple artists
	 */
	export type ManyWhereInput = Partial<
		RequireAtLeastOne<{
			library: Filter<LibraryQueryParameters.WhereInput>;
			name: SearchStringInput;
			artists: ArtistQueryParameters.WhereInput[];
			genre: Filter<GenreQueryParameters.WhereInput>;
			primaryArtistsOnly: boolean;
			album: Filter<AlbumQueryParameters.WhereInput>;
			label: Filter<LabelQueryParameters.WhereInput>;
		}>
	>;

	/**
	 * Parameters to update an Artist
	 */
	export type UpdateInput = Partial<CreateInput>;

	/**
	 * Parameters to delete an Artist
	 */
	export type DeleteInput = RequireExactlyOne<
		Omit<WhereInput, "compilationArtist">
	>;

	/**
	 * Parameters to find or create an Artist
	 */
	export type GetOrCreateInput = CreateInput;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = [
		"albums",
		"songs",
		"illustration",
	] as const;
	export const AvailableAtomicIncludes =
		filterAtomicRelationInclude(AvailableIncludes);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = [
		"id",
		"name",
		"albumCount",
		"songCount",
		"addDate",
	] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default ArtistQueryParameters;
