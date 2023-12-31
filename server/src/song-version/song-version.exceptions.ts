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

export class SongVersionNotFoundByIdException extends NotFoundException {
	constructor(songVersionId: number) {
		super(`No song version with id '${songVersionId}' found`);
	}
}

export class SongVersionNotFoundBySlugException extends NotFoundException {
	constructor(songVersion: Slug) {
		super(`No song version with slug '${songVersion}' found`);
	}
}

export class SongVersionAlreadyExistsException extends AlreadyExistsException {
	constructor(songVersionSlug: Slug, songSlug: Slug, artistSlug: Slug) {
		super(
			`Version '${songVersionSlug.toString()}' of song '${songSlug.toString()}' by '${artistSlug.toString()}' already exists`,
		);
	}
}

export class SongVersionNotEmptyException extends InvalidRequestException {
	constructor(songVersionId: number) {
		super(
			`Song Version n°${songVersionId} could not be deleted: It has related tracks`,
		);
	}
}

export class MainSongVersionNotFoundException extends NotFoundException {
	constructor(songSlug: Slug, artistSlug: Slug) {
		super(
			`Main Version of '${songSlug.toString()}' by ${artistSlug.toString()} not found`,
		);
	}
}
