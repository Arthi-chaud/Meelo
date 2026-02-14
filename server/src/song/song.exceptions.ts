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
	InvalidRequestException,
	NotFoundException,
} from "src/exceptions/meelo-exception";
import type Slug from "src/slug/slug";

export class SongNotFoundException extends NotFoundException {
	constructor(songSlugOrId: Slug | number) {
		super(
			typeof songSlugOrId === "number"
				? `Song ${songSlugOrId} not found`
				: `Song '${songSlugOrId}' not found`,
		);
	}
}

export class SongGroupNotFoundException extends NotFoundException {
	constructor(songGroupIdentifier: Slug | number) {
		super(
			typeof songGroupIdentifier === "number"
				? `No song group with id '${songGroupIdentifier}' found`
				: `Song Group not found '${songGroupIdentifier.toString()}'`,
		);
	}
}

export class SongAlreadyExistsException extends AlreadyExistsException {
	constructor(songSlug: Slug, artistSlug: Slug) {
		super(
			`'${songSlug.toString()}' from '${artistSlug.toString()}': Song already exists`,
		);
	}
}

export class SongGroupAlreadyExistsException extends AlreadyExistsException {
	constructor(songGroupSlug: Slug) {
		super(`Song Group already exists '${songGroupSlug.toString()}'`);
	}
}

export class SongNotEmptyException extends InvalidRequestException {
	constructor(songId: number) {
		super(`Song n°${songId} could not be deleted: It has related tracks`);
	}
}
