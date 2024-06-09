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
import type Slug from "src/slug/slug";
import type { RequireAtLeastOne, RequireExactlyOne } from "type-fest";
import type { SearchStringInput } from "src/utils/search-string-input";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import type GenreQueryParameters from "src/genre/models/genre.query-parameters";
import { Song } from "src/prisma/models";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import { SongType } from "@prisma/client";
import SongGroupQueryParameters from "./song-group.query-params";

namespace SongQueryParameters {
	/**
	 * The input required to save a song in the database
	 */
	export type CreateInput = Omit<
		Song,
		| "slug"
		| "nameSlug"
		| "id"
		| "playCount"
		| "artist"
		| "artistId"
		| "tracks"
		| "genres"
		| "lyrics"
		| "masterId"
		| "registeredAt"
		| "type"
		| "featuring"
		| "groupId"
	> & {
		artist: ArtistQueryParameters.WhereInput;
		group: SongGroupQueryParameters.GetOrCreateInput;
		featuring?: RequireExactlyOne<
			Pick<ArtistQueryParameters.WhereInput, "slug">
		>[];
		registeredAt?: Date;
		genres: GenreQueryParameters.WhereInput[];
	};

	/**
	 * Query paraeters to find a song
	 */
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
			library: LibraryQueryParameters.WhereInput;
			genre: GenreQueryParameters.WhereInput;
			group: SongGroupQueryParameters.WhereInput;
			versionsOf: SongQueryParameters.WhereInput;
			type?: SongType;
			id: { in: number[] };
		}>
	>;

	/**
	 * The input required to update a song in the database
	 */
	export type UpdateInput = Partial<{
		type: SongType;
		genres: GenreQueryParameters.WhereInput[];
	}>;
	export type DeleteInput = {
		id: Song["id"];
	};
	/**
	 * The input to find or create a song
	 */
	export type GetOrCreateInput = CreateInput;
	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = [
		"tracks",
		"artist",
		"featuring",
		"genres",
		"master",
		"lyrics",
		"externalIds",
	] as const;
	export const AvailableAtomicIncludes = filterAtomicRelationInclude(
		AvailableIncludes,
		["lyrics", "externalIds"],
	);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = [
		"id",
		"name",
		"totalPlayCount",
		"userPlayCount",
		"artistName",
		"addDate",
	] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default SongQueryParameters;
