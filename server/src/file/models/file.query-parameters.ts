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
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import type { File, Track } from "src/prisma/models";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import type ReleaseQueryParameters from "src/release/models/release.query-parameters";
import type SongQueryParameters from "src/song/models/song.query-params";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import type TrackQueryParameters from "src/track/models/track.query-parameters";
import type { SearchDateInput } from "src/utils/search-date-input";
import type { RequireAtLeastOne, RequireExactlyOne } from "type-fest";

namespace FileQueryParameters {
	/**
	 * Parameters to create a File
	 */
	export type CreateInput = Omit<File, "library" | "id" | "track">;
	/**
	 * Query parameters to find one file
	 */
	export type WhereInput = RequireExactlyOne<{
		trackId: Track["id"];
		id: File["id"];
		byPath: {
			path: File["path"];
			library: LibraryQueryParameters.WhereInput;
		};
	}>;

	/**
	 * Query parameters to find multiple files
	 */
	export type ManyWhereInput = Partial<
		RequireAtLeastOne<{
			inFolder: string;
			library: LibraryQueryParameters.WhereInput;
			album: AlbumQueryParameters.WhereInput;
			release: ReleaseQueryParameters.WhereInput;
			song: SongQueryParameters.WhereInput;
			track: TrackQueryParameters.WhereInput;
			files: FileQueryParameters.WhereInput[];
			paths: File["path"][];
			registrationDate: SearchDateInput;
		}>
	>;

	/**
	 * The parameters needed to update a File
	 */
	export type UpdateInput = Partial<CreateInput>;

	/**
	 * Query parameters to delete one file
	 */
	export type DeleteInput = Required<Pick<WhereInput, "id">>;

	export const SortingKeys = [
		"id",
		"trackName",
		"trackArtist",
		"addDate",
	] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}

	/**
	 * Relations to include in returned File object
	 */
	export const AvailableIncludes = ["track", "library"] as const;
	export const AvailableAtomicIncludes =
		filterAtomicRelationInclude(AvailableIncludes);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;
}

export default FileQueryParameters;
