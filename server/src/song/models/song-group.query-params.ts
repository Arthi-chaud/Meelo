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

import type { SongGroup } from "src/prisma/generated/client";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import type Slug from "src/slug/slug";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import type { RequireExactlyOne } from "type-fest";
import type SongQueryParameters from "./song.query-params";

namespace SongGroupQueryParameters {
	/**
	 * The input required to save a song group in the database
	 */
	export type CreateInput = {
		slug: Slug;
	};

	/**
	 * Query paraeters to find a song
	 */
	export type WhereInput = RequireExactlyOne<{
		id: SongGroup["id"];
		slug: Slug;
		song: SongQueryParameters.WhereInput;
	}>;

	/**
	 * Query params to find multiple songs
	 */
	export type ManyWhereInput = Record<string, never>;

	/**
	 * The input required to update a song in the database
	 */
	export type UpdateInput = Record<string, never>;
	export type DeleteInput = {
		id: SongGroup["id"];
	};
	/**
	 * The input to find or create a song group
	 */
	export type GetOrCreateInput = CreateInput;
	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ["songs"] as const;
	export const AvailableAtomicIncludes = filterAtomicRelationInclude(
		AvailableIncludes,
		["songs"],
	);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = ["id", "name"] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default SongGroupQueryParameters;
