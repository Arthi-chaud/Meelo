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
	constructor(albumSlug: Slug, artistSlug?: Slug) {
		super(
			`${albumSlug.toString()} ${
				artistSlug ? `by ${artistSlug.toString()}` : ""
			}: No such album`,
		);
	}
}

export class AlbumNotFoundFromIDException extends NotFoundException {
	constructor(id: number) {
		super(`No album with id ${id} exists`);
	}
}

export class AlbumAlreadyExistsException extends AlreadyExistsException {
	constructor(albumSlug: Slug, artistSlug?: Slug) {
		super(
			`${albumSlug.toString()} ${
				artistSlug ? `by ${artistSlug.toString()}` : ""
			} already exists`,
		);
	}
}

export class AlbumAlreadyExistsWithArtistIDException extends AlreadyExistsException {
	constructor(albumSlug: Slug, artistId: number) {
		super(`${albumSlug.toString()} by artist n°${artistId} already exists`);
	}
}

export class AlbumNotEmptyException extends InvalidRequestException {
	constructor(albumId: number) {
		super(
			`Album n°${albumId} could not be deleted: It has related releases`,
		);
	}
}
