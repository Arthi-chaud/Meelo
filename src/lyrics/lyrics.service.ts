import { Injectable } from '@nestjs/common';
import { getLyrics } from 'genius-lyrics-api';
import { MissingGeniusAPIKeyException, NoLyricsFoundException } from './lyrics.exceptions';

@Injectable()
export class LyricsService {
	private readonly geniusApiKey: string | null;
	constructor() {
		this.geniusApiKey = process.env.GENIUS_ACCESS_TOKEN ?? null
	}

	/**
	 * Fetch a song's lyrics from Genius
	 * @param artistName the name of the artist of the song
	 * @param songName the name of the song to fetch the lyrics of
	 */
	async downloadLyrics(artistName: string, songName: string): Promise<string> {
		if (!this.geniusApiKey)
			throw new MissingGeniusAPIKeyException();
		try {
			return await getLyrics({
				apiKey: this.geniusApiKey,
				title: songName,
				artist: artistName,
				optimizeQuery: true
			});
		} catch {
			throw new NoLyricsFoundException(artistName, songName);
		}
	}
}
