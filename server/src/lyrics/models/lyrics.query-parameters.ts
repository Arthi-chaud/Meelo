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

import type { Lyrics } from "src/prisma/models";
import type SongQueryParameters from "src/song/models/song.query-params";
import type { RequireExactlyOne } from "type-fest";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";

namespace LyricsQueryParameters {
	/**
	 * Parameters required to create a Lyric entry
	 */
	export type CreateInput = Omit<Lyrics, "id" | "song">;
	/**
	 * Query parameters to find one lyric entry
	 */
	export type WhereInput = RequireExactlyOne<
		Pick<Lyrics, "id"> & {
			song: SongQueryParameters.WhereInput;
		}
	>;

	/**
	 * Query parameters to find multiple lyric entry
	 */
	export type ManyWhereInput = Partial<{
		songs: SongQueryParameters.ManyWhereInput;
		id: { in: number[] };
	}>;

	/**
	 * The input required to update a lyric entry in the database
	 */
	export type UpdateInput = Pick<Lyrics, "content">;

	/**
	 * The input to find or create a lyric entry
	 */
	export type GetOrCreateInput = CreateInput;

	/**
	 * Query parameters to delete one lyric entry
	 */
	export type DeleteInput = RequireExactlyOne<Omit<Lyrics, "content">>;

	export class SortingParameter extends ModelSortingParameter([]) {}

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ["song"] as const;
	export const AvailableAtomicIncludes =
		filterAtomicRelationInclude(AvailableIncludes);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;
}

export default LyricsQueryParameters;
