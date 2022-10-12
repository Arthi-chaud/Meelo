import Artist from "./artist";
import Genre from "./genre";
import Illustration from "./illustration";
import Lyrics from "./lyrics";
import Resource from "./resource";

/**
 * Abstract data model, instanciated by tracks
 */
type Song = Resource & Illustration & {
	/**
	 * title of the song
	 */
	name: string;
	/*
	 * The slug of the release
	 * To be used with the parent's artist's slug:
	 * ${artistSlug}+${songSlug}
	 */
	slug: string;
	/**
	 * Unique identifier of the parent artist
	 */
	artistId: number;
	/**
	 * Number of times the song has been played
	 */
	playCount: number;
}

type SongWithArtist = Song & {
	artist: Artist;
}

type SongWithGenres = Song & {
	genres: Genre[];
}

type SongWithLyrics = Song & {
	lyrics: Lyrics;
}

type SongInclude = 'artist' | 'genres' | 'lyrics';

export default Song;
export const SongSortingKeys = ['name', 'playCount'];
export type { SongWithArtist, SongWithGenres, SongWithLyrics, SongInclude };