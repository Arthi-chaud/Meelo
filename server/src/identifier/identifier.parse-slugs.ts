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

import Slug from "src/slug/slug";
import Identifier from "./models/identifier";
import { SlugSeparator } from "./identifier.slug-separator";
import InvalidIdentifierSlugs from "./identifier.exceptions";

/**
 * Parse slugs in an identifier
 * If the obtained array's length does not match `expectedTokens`, throws
 */
export const parseIdentifierSlugs = (
	identifier: Identifier,
	expectedTokens?: number,
) => {
	const slugs = identifier
		.toString()
		.split(SlugSeparator)
		.map((slugString: string) => new Slug(slugString));

	if (expectedTokens != undefined && slugs.length != expectedTokens) {
		throw new InvalidIdentifierSlugs(
			identifier,
			expectedTokens,
			slugs.length,
		);
	}
	return slugs;
};
