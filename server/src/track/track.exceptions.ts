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
import type Slug from "src/slug/slug";

export class TrackNotFoundException extends NotFoundException {
	constructor(trackId: number) {
		super(`Track ${trackId} not found`);
	}
}

export class MasterTrackNotFoundException extends NotFoundException {
	constructor(songSlug: Slug, artistSlug: Slug) {
		super(
			`Master Track of '${songSlug.toString()}' by ${artistSlug.toString()} not found`,
		);
	}
}

export class TrackAlreadyExistsException extends AlreadyExistsException {
	constructor(trackName: string, releaseSlug: Slug, artistSlug?: Slug) {
		super(
			`Track '${trackName}' from '${releaseSlug.toString()}' ${
				artistSlug ? `by ${artistSlug.toString()}` : ""
			} already exists`,
		);
	}
}
