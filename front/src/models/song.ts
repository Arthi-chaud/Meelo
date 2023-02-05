import Artist from "./artist";
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
	/**
	 * The ID of the master track
	 */
	masterId?: number;
}

type SongInclude = 'artist' | 'lyrics';

type SongWithRelations<I extends K[], K extends SongInclude = SongInclude> = Song & Pick<
	{ artist: Artist, lyrics?: Lyrics },
	I[number]
>;

export default Song;
export const SongSortingKeys = [
	'name',
	'playCount',
	'artistName',
	'addDate'
] as const;
export type { SongWithRelations, SongInclude };
