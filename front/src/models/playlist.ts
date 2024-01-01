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

import Illustration from "./illustration";
import Resource from "./resource";
import * as yup from "yup";
import SongVersion from "./song-version";

const PlaylistEntry = SongVersion.concat(
	yup.object({
		/**
		 * The identifier of the entry
		 */
		entryId: yup.number().required(),
	}),
);

export type PlaylistEntry = yup.InferType<typeof PlaylistEntry>;

const Playlist = Resource.concat(Illustration).concat(
	yup.object({
		/**
		 * The name of the playlist
		 */
		name: yup.string().required(),
		/**
		 * Slug of the name
		 * Also an identifier of the playlist
		 */
		slug: yup.string().required(),
		/**
		 * the date the playlist was created
		 */
		createdAt: yup.date().required(),
	}),
);

type Playlist = yup.InferType<typeof Playlist>;

export type PlaylistInclude = "entries";

const PlaylistWithRelations = <
	Selection extends PlaylistInclude | never = never,
>(
	relation: Selection[],
) =>
	Playlist.concat(
		yup
			.object({
				entries: yup.array(PlaylistEntry.required()).required(),
			})
			.pick(relation),
	);

type PlaylistWithRelations<Selection extends PlaylistInclude | never = never> =
	yup.InferType<ReturnType<typeof PlaylistWithRelations<Selection>>>;

export default Playlist;

export const PlaylistSortingKeys = [
	"name",
	"entryCount",
	"creationDate",
] as const;

export { PlaylistWithRelations };
