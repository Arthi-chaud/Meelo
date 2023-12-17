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

import Artist from "../models/artist";

const formatArtists = (
	artist: Pick<Artist, "name">,
	featuring?: Pick<Artist, "name">[],
): string => {
	if (!featuring || featuring.length == 0) {
		return artist.name;
	}
	const [firstFeat, ...otherFeats] = featuring;

	if (otherFeats.length == 0) {
		return `${artist.name} & ${firstFeat.name}`;
	}
	return `${artist.name}, ${featuring
		.map(({ name }) => name)
		.slice(0, -1)
		.join(", ")} & ${featuring.at(-1)?.name}`;
};

export default formatArtists;
