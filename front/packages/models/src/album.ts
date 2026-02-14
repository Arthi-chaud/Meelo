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
import Genre from "./genre";
import Illustration from "./illustration";
import Resource from "./resource";
import { yupdate } from "./utils";

export const AlbumType = [
	"StudioRecording",
	"Single",
	"EP",
	"LiveRecording",
	"Compilation",
	"Soundtrack",
	"RemixAlbum",
	"VideoAlbum",
] as const;

export type AlbumType = (typeof AlbumType)[number];

const Album = Resource.concat(
	yup.object({
		/**
		 * The name of the album
		 */
		name: yup.string().required(),
		/**
		 * The slug of the album
		 */
		slug: yup.string().required(),
		/**
		 * The date of the first release of the album
		 * If unknown, the field is set to null
		 */
		releaseDate: yupdate.required().nullable(),
		/**
		 * Type of the album
		 */
		type: yup.mixed<AlbumType>().oneOf(AlbumType).required(),
		/**
		 * Unique identifier of the parent artist
		 * If undefined, the album is a compilation
		 */
		artistId: yup.number().required().nullable(),
		/**
		 * Unique identifier of the master release
		 * If undefined, the first related release is chosen
		 */
		masterId: yup.number().required().nullable(),
	}),
);

type Album = yup.InferType<typeof Album>;

export default Album;

export type AlbumInclude = "artist" | "genres" | "illustration";

export const AlbumWithRelations = <
	Selection extends AlbumInclude | never = never,
>(
	relation: Selection[],
) =>
	Album.concat(
		yup
			.object({
				artist: Artist.required().nullable(),
				genres: yup.array(Genre.required()).required(),
				illustration: Illustration.required().nullable(),
			})
			.pick(relation),
	);

export type AlbumWithRelations<Selection extends AlbumInclude | never = never> =
	yup.InferType<ReturnType<typeof AlbumWithRelations<Selection>>>;

export const AlbumSortingKeys = [
	"name",
	"artistName",
	"releaseDate",
	"addDate",
] as const;
export type AlbumSortingKey = (typeof AlbumSortingKeys)[number];
