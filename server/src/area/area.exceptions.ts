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

import {
	AlreadyExistsException,
	NotFoundException,
} from "src/exceptions/meelo-exception";
import Slug from "src/slug/slug";

export class AreaAlreadyExistsException extends AlreadyExistsException {
	constructor(labelSlug: string | Slug) {
		super(`Area ${labelSlug.toString()} already exists`);
	}
}

export class AreaNotFoundException extends NotFoundException {
	constructor(areaIdOrMbid: string | number) {
		super(
			typeof areaIdOrMbid === "number"
				? `Area ${areaIdOrMbid} not found`
				: `Area '${areaIdOrMbid}' not found`,
		);
	}
}
