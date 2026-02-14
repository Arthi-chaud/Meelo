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
	InvalidRequestException,
	NotFoundException,
} from "src/exceptions/meelo-exception";
import type Slug from "src/slug/slug";

export class GenreNotFoundException extends NotFoundException {
	constructor(genreIdentifier: Slug | number) {
		super(
			typeof genreIdentifier === "number"
				? `Genre with id '${genreIdentifier}' does not exist`
				: `Genre '${genreIdentifier.toString()}' does not exist`,
		);
	}
}

export class GenreAlreadyExistsException extends NotFoundException {
	constructor(genreSlug: Slug) {
		super(`Genre '${genreSlug.toString()}' already exists`);
	}
}

export class GenreNotEmptyException extends InvalidRequestException {
	constructor(genreId: number) {
		super(`Genre n°${genreId} could not be deleted: It has related songs`);
	}
}
