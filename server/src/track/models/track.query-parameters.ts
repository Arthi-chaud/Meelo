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

import { TrackType } from "@prisma/client";
import { Track } from "src/prisma/models";
import type FileQueryParameters from "src/file/models/file.query-parameters";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import type ReleaseQueryParameters from "src/release/models/release.query-parameters";
import type SongQueryParameters from "src/song/models/song.query-params";
import type { RequireAtLeastOne, RequireExactlyOne } from "type-fest";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";

namespace TrackQueryParameters {
	/**
	 * The input required to save a track in the database
	 */
	export type CreateInput = Omit<
		Track,
		| "id"
		| "sourceFile"
		| "sourceFileId"
		| "release"
		| "releaseId"
		| "song"
		| "songId"
	> & { sourceFile: FileQueryParameters.WhereInput } & {
		release: ReleaseQueryParameters.WhereInput;
	} & { song: SongQueryParameters.WhereInput };

	/**
	 * Query parameters to find one track
	 */
	export type WhereInput = RequireExactlyOne<{
		id: Track["id"];
		sourceFile: FileQueryParameters.WhereInput;
	}>;

	/**
	 * Query parameters to find multiple tracks
	 */
	export type ManyWhereInput = Partial<
		RequireAtLeastOne<
			{
				type: TrackType;
				id: { in: number[] };
				song: SongQueryParameters.WhereInput;
				library: LibraryQueryParameters.WhereInput;
			} & RequireExactlyOne<{
				artist: ArtistQueryParameters.WhereInput;
				album: AlbumQueryParameters.WhereInput;
				release: ReleaseQueryParameters.WhereInput;
			}>
		>
	>;

	/**
	 * The input required to update a track in the database
	 */
	export type UpdateInput = Partial<CreateInput>;

	/**
	 * The input to find or create a track
	 */
	export type GetOrCreateInput = CreateInput;

	/**
	 * Parameters to update the master track of a song
	 */
	export type UpdateSongMaster = {
		trackId: Track["id"];
		song: SongQueryParameters.WhereInput;
	};

	/**
	 * Query parameters to delete one track
	 */
	export type DeleteInput = RequireExactlyOne<{
		sourceFileId: number;
		id: number;
	}>;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ["song", "release", "sourceFile"] as const;
	export const AvailableAtomicIncludes =
		filterAtomicRelationInclude(AvailableIncludes);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = [
		"id",
		"name",
		"releaseName",
		"duration",
		"bitrate",
		"trackIndex",
		"discIndex",
		"addDate",
		"releaseDate",
	] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default TrackQueryParameters;
