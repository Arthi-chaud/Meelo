import { NotFoundException } from "@nestjs/common";
import { AlreadyExistsException, InvalidRequestException } from "src/exceptions/meelo-exception";
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
export class LyricsNotFoundByIDException extends NotFoundException {
	constructor(lyricId: number) {
		super(`No lyrics with id '${lyricId}' exist.`);
	}
}

/**
 * Exception when the Genius API did not find any lyrics matching the request
 */
export class NoLyricsFoundException extends NotFoundException {
	constructor(artistName: string, songName: string) {
		super(`No lyrics from for the song '${songName}' by '${artistName}'`);
	}
}

/**
 * Exception when the Genius API is missing and the lyrics are requested
 */
 export class MissingGeniusAPIKeyException extends InvalidRequestException {
	constructor() {
		super(`No (or empty) Genius API Key provided`);
	}
}