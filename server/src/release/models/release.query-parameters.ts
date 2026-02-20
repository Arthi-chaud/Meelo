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
import LabelQueryParameters from "src/label/label.query-parameters";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import type { Release } from "src/prisma/models";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import type Slug from "src/slug/slug";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import type { SearchStringInput } from "src/utils/search-string-input";
import type { RequireExactlyOne } from "type-fest";

namespace ReleaseQueryParameters {
	/**
	 * Parameters to create a release
	 */
	export type CreateInput = Omit<
		Release,
		| "releaseDate"
		| "album"
		| "albumId"
		| "id"
		| "slug"
		| "nameSlug"
		| "tracks"
		| "label"
		| "labelId"
		| "externalMetadata"
		| "registeredAt"
	> & {
		releaseDate?: Date;
		registeredAt?: Date;
		label?: LabelQueryParameters.WhereInput;
		album: AlbumQueryParameters.WhereInput;
		discogsId?: string;
	};

	/**
	 * Query parameters to find one release
	 */
	export type WhereInput = RequireExactlyOne<{
		id: number;
		slug: Slug;
	}>;

	/**
	 * Query parameters to find multiple Releases
	 */
	export type ManyWhereInput = Partial<{
		name: SearchStringInput;
		album: Filter<AlbumQueryParameters.WhereInput>;
		library: Filter<LibraryQueryParameters.WhereInput>;
		label: Filter<LabelQueryParameters.WhereInput>;
		releases: ReleaseQueryParameters.WhereInput[];
	}>;

	/**
	 * Parameters to update a Release
	 */
	export type UpdateInput = Partial<
		Pick<CreateInput, "releaseDate" | "label">
	>;

	/**
	 * Parameters to update the master release of an album
	 */
	export type UpdateAlbumMaster = {
		releaseId: Release["id"];
		album: AlbumQueryParameters.WhereInput;
	};

	/**
	 * Parameters to find or create an Release
	 */
	export type GetOrCreateInput = CreateInput;

	/**
	 * Query parameters to delete one release
	 */
	export type DeleteInput = Required<Pick<WhereInput, "id">>;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = [
		"album",
		"tracks",
		"illustration",
		"discs",
		"label",
		"localIdentifiers",
	] as const;
	export const AvailableAtomicIncludes = filterAtomicRelationInclude(
		AvailableIncludes,
		["discs", "localIdentifiers"],
	);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = [
		"id",
		"name",
		"releaseDate",
		"trackCount",
		"addDate",
	] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default ReleaseQueryParameters;
