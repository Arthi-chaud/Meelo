import { NotFoundException } from "@nestjs/common";
import { InvalidRequestException } from "src/exceptions/meelo-exception";

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