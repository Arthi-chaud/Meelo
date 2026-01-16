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

import {
	ApiPropertyOptional,
	IntersectionType,
	PartialType,
	PickType,
} from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { EnumFilter, Filter } from "src/filter/filter";
import type GenreQueryParameters from "src/genre/models/genre.query-parameters";
import LabelQueryParameters from "src/label/label.query-parameters";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import { AlbumType } from "src/prisma/generated/client";
import { Album } from "src/prisma/models";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import type ReleaseQueryParameters from "src/release/models/release.query-parameters";
import type Slug from "src/slug/slug";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import type { SearchDateInput } from "src/utils/search-date-input";
import type { SearchStringInput } from "src/utils/search-string-input";
import type { RequireAtLeastOne, RequireExactlyOne } from "type-fest";

namespace AlbumQueryParameters {
	/**
	 * The input required to save an album in the database
	 */
	export class CreateInput extends IntersectionType(
		PickType(Album, ["name"] as const),
		class {
			releaseDate?: Date;
			registeredAt?: Date;
			sortName?: string;
			artist?: ArtistQueryParameters.WhereInput;
		},
	) {}

	/**
	 * Query parameters to find one album
	 */
	export type WhereInput = RequireExactlyOne<{
		id: Album["id"];
		slug: Slug;
	}>;

	/**
	 * Query parameters to find multiple albums
	 */
	export type ManyWhereInput = Partial<
		RequireAtLeastOne<{
			artist: Filter<ArtistQueryParameters.WhereInput>;
			appearance: Filter<ArtistQueryParameters.WhereInput>;
			name: SearchStringInput;
			library: Filter<LibraryQueryParameters.WhereInput>;
			releaseDate: SearchDateInput;
			genre: Filter<GenreQueryParameters.WhereInput>;
			label: Filter<LabelQueryParameters.WhereInput>;
			type: EnumFilter<AlbumType>;
			albums: AlbumQueryParameters.WhereInput[];
			// Get albums with a song in common. Does not include the given album
			related: AlbumQueryParameters.WhereInput;
		}>
	>;

	/**
	 * The input required to update an album in the database
	 */
	export class UpdateInput extends PartialType(
		PickType(Album, ["type", "releaseDate"] as const),
	) {
		master?: ReleaseQueryParameters.WhereInput;
		genres?: string[];
	}

	/**
	 * The input to find or create an album
	 */
	export type GetOrCreateInput = CreateInput;

	/**
	 * Query parameters to delete one album
	 */
	export type DeleteInput = Required<Pick<WhereInput, "id">>;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = [
		"releases",
		"artist",
		"master",
		"genres",
		"illustration",
	] as const;
	export const AvailableAtomicIncludes = filterAtomicRelationInclude(
		AvailableIncludes,
		["genres"],
	);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = [
		"id",
		"name",
		"artistName",
		"releaseDate",
		"addDate",
	] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}

	export class AlbumFilterParameter {
		@IsEnum(AlbumType, {
			message: () =>
				`Album Type: Invalid value. Expected one of theses: ${Object.keys(
					AlbumType,
				)}`,
		})
		@IsOptional()
		@ApiPropertyOptional({ enum: AlbumType })
		type?: AlbumType;
	}
}

export default AlbumQueryParameters;
