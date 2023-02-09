import { z } from "zod";
import Artist from "./artist";
import Illustration from "./illustration";
import Lyrics from "./lyrics";
import Resource from "./resource";
import Track from "./track";

/**
 * Abstract data model, instanciated by tracks
 */
const Song = z.intersection(
	Resource,
	Illustration
).and(z.object({
	/**
	 * title of the song
	 */
	name: z.string(),
	/*
	 * The slug of the release
	 * To be used with the parent's artist's slug:
	 * ${artistSlug}+${songSlug}
	 */
	slug: z.string(),
	/**
	 * Unique identifier of the parent artist
	 */
	artistId: z.number(),
	/**
	 * Number of times the song has been played
	 */
	playCount: z.number(),
	/**
	 * The ID of the master track
	 */
	masterId: z.number().nullable()
}));

type Song = z.infer<typeof Song>;

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
