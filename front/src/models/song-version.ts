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
import Resource from "./resource";
import Illustration from "./illustration";
import Song from "./song";
import Artist from "./artist";
import Track from "./track";

export const SongVersionType = [
	"Original",
	"Remix",
	"Live",
	"Acoustic",
	"Instrumental",
	"Edit",
	"Clean",
	"Demo",
	"Acapella",
	"NonMusic",
] as const;
export type SongVersionType = (typeof SongVersionType)[number];

const SongVersion = Resource.concat(Illustration).concat(
	yup.object({
		/**
		 * title of the version
		 */
		name: yup.string().required(),
		/*
		 * The slug of the version
		 */
		slug: yup.string().required(),
		/**
		 * Unique identifier of the parent song
		 */
		songId: yup.number().required(),
		/**
		 * Unique identifier of the master track
		 */
		masterId: yup.number().required().nullable(),
		/**
		 * Type of song
		 */
		type: yup.mixed<SongVersionType>().oneOf(SongVersionType).required(),
	}),
);

type SongVersion = yup.InferType<typeof SongVersion>;

type SongVersionInclude = "song" | "tracks" | "featuring";

const SongVersionRelations = yup.object({
	song: Song.required(),
	featuring: yup.array(Artist.required()).required(),
	tracks: yup.array(Track.required()).required(),
});

const SongVersionWithRelations = <
	Selection extends SongVersionInclude | never = never,
>(
	relation: Selection[],
) => Song.concat(SongVersionRelations.pick(relation));

type SongVersionWithRelations<
	Selection extends SongVersionInclude | never = never,
> = yup.InferType<ReturnType<typeof SongVersionWithRelations<Selection>>>;

export const SongVersionSortingKeys = ["name", "slug"] as const;

export default SongVersion;
export {
	type SongVersionInclude,
	SongVersionWithRelations,
	SongVersionRelations,
};
