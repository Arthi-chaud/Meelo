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

import ExternalId from "./external-id";
import Illustration from "./illustration";
import Resource from "./resource";
import * as yup from "yup";

const Artist = Resource.concat(Illustration).concat(
	yup.object({
		/**
		 * The name of the artist
		 */
		name: yup.string().required(),
		/**
		 * Slug of the name
		 * Also an identifier of the artist
		 */
		slug: yup.string().required(),
	}),
);

type Artist = yup.InferType<typeof Artist>;

export type ArtistInclude = "externalIds";

const ArtistWithRelations = <Selection extends ArtistInclude | never = never>(
	relation: Selection[],
) =>
	Artist.concat(
		yup
			.object({
				externalIds: yup.array(ExternalId.required()).required(),
			})
			.pick(relation),
	);

type ArtistWithRelations<Selection extends ArtistInclude | never = never> =
	yup.InferType<ReturnType<typeof ArtistWithRelations<Selection>>>;

export default Artist;

export const ArtistSortingKeys = [
	"name",
	"albumCount",
	"songCount",
	"addDate",
] as const;

export { ArtistWithRelations };
