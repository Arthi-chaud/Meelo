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

import { NotFoundException } from "@nestjs/common";
import {
	AlreadyExistsException,
	InvalidRequestException,
} from "src/exceptions/meelo-exception";
import type Slug from "src/slug/slug";

/**
 * Exception when lyrics for a song already exist
 */
export class LyricsAlreadyExistsExceptions extends AlreadyExistsException {
	constructor(songSlug: Slug) {
		super(`Lyrics for song '${songSlug.toString()}' already exists`);
	}
}

/**
 * Exception when no lyrics exist in the database
 */
export class LyricsNotFoundBySongException extends NotFoundException {
	constructor(songId: Slug | number) {
		super(`No lyrics from for the song '${songId.toString()}'`);
	}
}
export class LyricsNotFoundException extends NotFoundException {
	constructor(lyricId: number) {
		super(`No lyrics with id '${lyricId}' exist.`);
	}
}

/**
 * Exception when the Genius API is missing and the lyrics are requested
 */
export class MissingGeniusAPIKeyException extends InvalidRequestException {
	constructor() {
		super("No (or empty) Genius API Key provided");
	}
}
