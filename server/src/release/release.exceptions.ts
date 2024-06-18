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

export class ReleaseNotFoundException extends NotFoundException {
	constructor(releaseSlugOrId: Slug | number) {
		super(
			typeof releaseSlugOrId === "number"
				? `Release ${releaseSlugOrId} not found`
				: `Release '${releaseSlugOrId.toString()}' not found`,
		);
	}
}

export class ReleaseAlreadyExists extends AlreadyExistsException {
	constructor(releaseSlug: Slug, artistSlug?: Slug) {
		super(
			`Release '${releaseSlug.toString()}' ${
				artistSlug ? `by ${artistSlug.toString()} ` : ""
			}already exists`,
		);
	}
}

export class MasterReleaseNotFoundException extends NotFoundException {
	constructor(albumSlug: Slug, artistSlug?: Slug) {
		super(
			`Master Release of ${albumSlug.toString()} ${
				artistSlug ? `by ${artistSlug.toString()}` : ""
			} not found`,
		);
	}
}

export class ReleaseNotEmptyException extends InvalidRequestException {
	constructor(releaseId: number) {
		super(
			`Release n°${releaseId} could not be deleted: It has related tracks`,
		);
	}
}
