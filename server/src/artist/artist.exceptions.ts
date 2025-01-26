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

export class ArtistNotFoundException extends NotFoundException {
	constructor(artistIdentifier: Slug | number) {
		super(
			typeof artistIdentifier === "number"
				? `Artist with id '${artistIdentifier}' not found`
				: `Artist '${artistIdentifier.toString()}' not found`,
		);
	}
}

export class CompilationArtistException extends InvalidRequestException {
	constructor(actionName: string) {
		super(
			`The action '${actionName}' cannot be performed for the 'Compilation' artist`,
		);
	}
}

export class ArtistAlreadyExistsException extends AlreadyExistsException {
	constructor(artistSlug: Slug) {
		super(`Artist '${artistSlug.toString()}' already exists`);
	}
}

export class ArtistNotEmptyException extends InvalidRequestException {
	constructor(artistSlugOrId: Slug | number) {
		super(
			`Artist '${artistSlugOrId.toString()}' can not be deleted: it has related songs and/or albums`,
		);
	}
}
