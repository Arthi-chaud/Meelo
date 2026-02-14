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
import Artist from "./artist";
import Illustration from "./illustration";
import { Lyrics } from "./lyrics";
import Resource from "./resource";
import Track from "./track";

export const SongType = [
	"Original",
	"Remix",
	"Live",
	"Acoustic",
	"Demo",
	"Medley",
	"Instrumental",
	"Acappella",
	"Edit",
	"Clean",
	"NonMusic",
	"Unknown",
] as const;
export type SongType = (typeof SongType)[number];

/**
 * Abstract data model, instanciated by tracks
 */
export const Song = Resource.concat(
	yup.object({
		/**
		 * title of the song
		 */
		name: yup.string().required(),
		/*
		 * The slug of the release
		 */
		slug: yup.string().required(),
		/**
		 * Unique identifier of the parent artist
		 */
		artistId: yup.number().required(),
		/**
		 * The ID of the master track
		 */
		masterId: yup.number().required().nullable(),
		groupId: yup.number().required(),
		/**
		 * Type of song
		 */
		type: yup.mixed<SongType>().oneOf(SongType).required(),
		bpm: yup.number().required().nullable(),
	}),
);

export type Song = yup.InferType<typeof Song>;

export type SongInclude =
	| "artist"
	| "lyrics"
	| "featuring"
	| "master"
	| "illustration";

export const SongRelations = yup.object({
	artist: Artist.required(),
	master: yup.lazy(() => Track.required()),
	featuring: yup.array(Artist.required()).required(),
	lyrics: Lyrics.required().nullable(),
	illustration: Illustration.required().nullable(),
});

export const SongWithRelations = <
	Selection extends SongInclude | never = never,
>(
	relation: Selection[],
) => Song.concat(SongRelations.pick(relation));

export type SongWithRelations<Selection extends SongInclude | never = never> =
	yup.InferType<ReturnType<typeof SongWithRelations<Selection>>>;

export default Song;
export const SongSortingKeys = [
	"name",
	"bpm",
	"artistName",
	"releaseDate",
	"addDate",
	"userPlayCount",
	"totalPlayCount",
] as const;
export type SongSortingKey = (typeof SongSortingKeys)[number];
