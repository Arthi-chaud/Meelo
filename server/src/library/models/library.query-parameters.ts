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

import type { Library } from "src/prisma/models";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import type Slug from "src/slug/slug";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import type { SearchStringInput } from "src/utils/search-string-input";
import type { RequireExactlyOne } from "type-fest";

namespace LibraryQueryParameters {
	/**
	 * Parameters required to create a Library
	 */
	export type CreateInput = Omit<Library, "id" | "slug" | "files">;

	/**
	 * The Query parameters to get a library
	 */
	export type WhereInput = RequireExactlyOne<{
		id: Library["id"];
		slug: Slug;
	}>;

	/**
	 * The Query parameters to get multiple libraries
	 */
	export type ManyWhereInput = Partial<
		RequireExactlyOne<{
			name: SearchStringInput;
			id: { in: number[] };
		}>
	>;

	/**
	 * The Query parameters to update a library
	 */
	export type UpdateInput = Partial<CreateInput>;

	/**
	 * The Query Parameters to delete a library
	 */
	export type DeleteInput = WhereInput;

	/**
	 * The relation field to include in a returned library
	 */
	export const AvailableIncludes = ["files"] as const;
	export const AvailableAtomicIncludes =
		filterAtomicRelationInclude(AvailableIncludes);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = ["id", "name", "fileCount", "addDate"] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default LibraryQueryParameters;
