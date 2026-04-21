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

import type Artist from "@/models/artist";

const formatArtists = (
	artist: Pick<Artist, "name" | "id">,
	featuring?: Pick<Artist, "name" | "id">[],
	mainArtists?: Pick<Artist, "id">[] | null,
): string => {
	mainArtists ??= [];
	if (!featuring || featuring.length === 0) {
		return artist.name;
	}
	if (mainArtists.length > 1) {
		const mainArtistIds = mainArtists.map(({ id }) => id);
		if (mainArtistIds.includes(artist.id)) {
			return formatArtists(
				artist,
				featuring.filter(({ id }) => !mainArtistIds.includes(id)),
				[artist],
			);
		}
		return formatArtists(artist, featuring, []);
	}
	const mainArtist = mainArtists.at(0);
	const nameLists = (
		mainArtist?.id === artist.id
			? (featuring ?? [])
			: [artist, ...featuring]
	).map((a) => a.name);
	const formattedString =
		nameLists.length === 1
			? nameLists[0]
			: `${nameLists.slice(0, -1).join(", ")} & ${nameLists.at(-1)}`;
	if (mainArtist?.id === artist.id) {
		return `Feat. ${formattedString}`;
	} else {
		return formattedString;
	}
};

export const formatArtists_ = (artists: Pick<Artist, "name" | "id">[]) =>
	formatArtists(artists[0], artists.slice(1));

export default formatArtists;
