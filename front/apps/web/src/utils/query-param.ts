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

import type { NextRouter } from "next/router";

export const parseQueryParam = <Keys extends readonly string[]>(
	input: any,
	optionValues: Keys,
): Keys[number] | null => {
	if (Array.isArray(input)) {
		input = input[0];
	}
	for (const option of optionValues) {
		if (input === option) {
			return option;
		}
	}
	return null;
};

export const setQueryParam = (
	keysAndValues: [string, string | null][],
	router: NextRouter,
) => {
	const path = router.asPath.split("?")[0];
	const params = new URLSearchParams(router.asPath.split("?").at(1) ?? "");

	for (const [key, value] of keysAndValues) {
		if (value) {
			params.set(key, value);
		} else {
			params.delete(key);
		}
	}
	router.push(`${path}?${params.toString()}`, undefined, {
		shallow: true,
	});
};
