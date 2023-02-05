import Artist from "./artist";
import Illustration from "./illustration";
import Lyrics from "./lyrics";
import Resource from "./resource";
import Track from "./track";

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

type BaseSongWithRelations<
	S extends Song, I extends K[], K extends SongInclude = SongInclude
> = S & Pick<
	{ artist: Artist, lyrics?: Lyrics },
	I[number]
>;

type SongWithRelations<
	I extends K[], K extends SongInclude = SongInclude
> = BaseSongWithRelations<Song, I, K>;

type SongWithVideo = Song & {
	video: Track;
};

type SongWithVideoWithRelations<
	I extends K[], K extends SongInclude = SongInclude
> = BaseSongWithRelations<SongWithVideo, I, K>;

export default Song;
export const SongSortingKeys = [
	'name',
	'playCount',
	'artistName',
	'addDate'
] as const;
export type { SongWithRelations, SongWithVideoWithRelations, SongWithVideo, SongInclude };
