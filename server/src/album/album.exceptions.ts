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

export class AlbumNotFoundException extends NotFoundException {
	constructor(albumIdentifier: Slug | number) {
		super(
			typeof albumIdentifier === "number"
				? `Album ${albumIdentifier} not found`
				: `Album '${albumIdentifier.toString()}' not found`,
		);
	}
}

export class AlbumAlreadyExistsException extends AlreadyExistsException {
	constructor(albumSlug: Slug, artistIdentifier?: Slug | number) {
		super(
			`${albumSlug.toString()} ${
				artistIdentifier
					? `by artist ${artistIdentifier.toString()}`
					: "by compilation artist"
			} already exists`,
		);
	}
}

export class AlbumNotEmptyException extends InvalidRequestException {
	constructor(albumId: number) {
		super(
			`Album n°${albumId} could not be deleted: It has related releases`,
		);
	}
}
