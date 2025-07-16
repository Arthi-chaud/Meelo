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

import type Illustration from "@/models/illustration";

export const useAccentColor = (illustration?: Illustration | null) => {
	const sortedColors = Array.of(...(illustration?.colors ?? [])).sort();

	if (sortedColors.length < 3) {
		return null;
	}
	return {
		light: Array.of(...sortedColors)
			.reverse()
			.at(3)!,
		dark: sortedColors.at(3)!,
	};
};
