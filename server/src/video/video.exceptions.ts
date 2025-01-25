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

export class VideoAlreadyExistsException extends AlreadyExistsException {
	constructor(videoName: string, artistName: string) {
		super(`Video ${videoName} by ${artistName} already exists`);
	}
}

export class VideoNotFoundException extends NotFoundException {
	constructor(videoSlugOrId: Slug | number) {
		super(
			typeof videoSlugOrId === "number"
				? `Video ${videoSlugOrId} not found`
				: `Video '${videoSlugOrId}' not found`,
		);
	}
}
