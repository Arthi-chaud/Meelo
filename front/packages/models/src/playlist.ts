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

import * as yup from "yup";
import Illustration from "./illustration";
import Resource from "./resource";
import Song, { type SongInclude, SongWithRelations } from "./song";
import { yupdate } from "./utils";

export const PlaylistEntry = Song.concat(
	yup.object({
		/**
		 * The identifier of the entry
		 */
		entryId: yup.number().required(),
	}),
);

export type PlaylistEntry = yup.InferType<typeof PlaylistEntry>;

export const PlaylistEntryWithRelations = <
	Selection extends SongInclude | never = never,
>(
	relation: Selection[],
) => PlaylistEntry.concat(SongWithRelations(relation));

export type PlaylistEntryWithRelations<
	Selection extends SongInclude | never = never,
> = yup.InferType<ReturnType<typeof PlaylistEntryWithRelations<Selection>>>;

export const Playlist = Resource.concat(
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
		createdAt: yupdate.required(),
		// The ID of the user that created the playlist
		ownerId: yup.number().required(),
		// If true, playlist is visible to non-owners of the playlist
		isPublic: yup.boolean().required(),
		// If true, non-owners can add tracks to the playlist
		allowChanges: yup.boolean().required(),
	}),
);

export type Playlist = yup.InferType<typeof Playlist>;

export type PlaylistInclude = "illustration";

export const PlaylistWithRelations = <
	Selection extends PlaylistInclude | never = never,
>(
	relation: Selection[],
) =>
	Playlist.concat(
		yup
			.object({
				illustration: Illustration.required().nullable(),
			})
			.pick(relation),
	);

export type PlaylistWithRelations<
	Selection extends PlaylistInclude | never = never,
> = yup.InferType<ReturnType<typeof PlaylistWithRelations<Selection>>>;

export default Playlist;

export const PlaylistSortingKeys = [
	"name",
	"entryCount",
	"creationDate",
] as const;

export type CreatePlaylistDto = {
	name: string;
	isPublic: boolean;
	allowChanges: boolean;
};

export type UpdatePlaylistDto = CreatePlaylistDto;
