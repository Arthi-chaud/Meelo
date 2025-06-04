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
import Album from "./album";
import { Disc } from "./disc";
import Illustration from "./illustration";
import Label from "./label";
import Resource from "./resource";
import { yupdate } from "./utils";

/**
 * A version of an album
 */
const Release = Resource.concat(
	yup.object({
		/**
		 * The title of the release
		 */
		name: yup.string().required(),
		/**
		 * The Extensions from the release's name
		 */
		extensions: yup.array(yup.string().required()).required(),
		/**
		 * The unique ID of the release
		 */
		id: yup.number().required(),
		/**
		 * The slug of the release
		 */
		slug: yup.string().required(),
		/**
		 * Unique identifier of the parent album
		 */
		albumId: yup.number().required(),
		/**
		 * Date the release was *released*
		 */
		releaseDate: yupdate.required().nullable(),
		/**
		 * Unique identifier of the label
		 */
		labelId: yup.number().required().nullable(),
	}),
);

type Release = yup.InferType<typeof Release>;

export default Release;

export type ReleaseInclude = "album" | "illustration" | "discs" | "label";

export const ReleaseWithRelations = <
	Selection extends ReleaseInclude | never = never,
>(
	relation: Selection[],
) =>
	Release.concat(
		yup
			.object({
				album: Album.required(),
				label: Label.required().nullable(),
				illustration: Illustration.required().nullable(),
				discs: yup.array(Disc.required()).required(),
			})
			.pick(relation),
	);

export type ReleaseWithRelations<
	Selection extends ReleaseInclude | never = never,
> = yup.InferType<ReturnType<typeof ReleaseWithRelations<Selection>>>;

export const ReleaseSortingKeys = [
	"name",
	"releaseDate",
	"trackCount",
	"addDate",
] as const;
