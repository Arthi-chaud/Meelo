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

import { PickType } from "@nestjs/swagger";
import { Playlist } from "src/prisma/models";
import Slug from "src/slug/slug";
import SongQueryParameters from "src/song/models/song.query-params";
import type { RequireAtLeastOne, RequireExactlyOne } from "type-fest";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";

namespace PlaylistQueryParameters {
	/**
	 * The input required to save a playlist in the database
	 */
	export class CreateInput extends PickType(Playlist, ["name"] as const) {}

	/**
	 * Query parameters to find one playlist
	 */
	export type WhereInput = RequireExactlyOne<{
		id: number;
		slug: Slug;
	}>;

	/**
	 * Query parameters to find multiple playlist
	 */
	export type ManyWhereInput = Partial<
		RequireAtLeastOne<{
			song: SongQueryParameters.WhereInput;
			album: AlbumQueryParameters.WhereInput;
			id: { in: number[] };
		}>
	>;

	/**
	 * The input required to update an album in the database
	 */
	export type UpdateInput = CreateInput;

	/**
	 * The input to find or create an album
	 */
	export type GetOrCreateInput = CreateInput;

	/**
	 * Query parameters to delete one album
	 */
	export type DeleteInput = WhereInput;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ["illustration"] as const;
	export const AvailableAtomicIncludes =
		filterAtomicRelationInclude(AvailableIncludes);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = [
		"id",
		"name",
		"entryCount",
		"creationDate",
	] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default PlaylistQueryParameters;
