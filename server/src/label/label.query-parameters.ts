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

import { Label } from "src/prisma/generated/client";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { Filter } from "src/filter/filter";
import Slug from "src/slug/slug";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import { RequireExactlyOne } from "type-fest";

namespace LabelQueryParameters {
	export type CreateInput = Pick<Label, "name">;
	export type WhereInput = RequireExactlyOne<{ id: number; slug?: Slug }>;
	export type ManyWhereInput = Partial<{
		album: Filter<AlbumQueryParameters.WhereInput>;
		artist: Filter<ArtistQueryParameters.WhereInput>;
	}>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = ["id", "name", "releaseCount"] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default LabelQueryParameters;
