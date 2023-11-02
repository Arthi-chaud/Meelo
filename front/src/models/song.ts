import * as yup from 'yup';
import Artist from "./artist";
import Illustration from "./illustration";
import Lyrics from "./lyrics";
import Resource from "./resource";
import ExternalId from './external-id';

export const SongType = ['Original', 'Remix', 'Live', 'Acoustic', 'Instrumental', 'Edit', 'Clean', 'Demo', 'Unknown', 'Acapella'] as const;
export type SongType = typeof SongType[number];

/**
 * Abstract data model, instanciated by tracks
 */
const Song = Resource.concat(Illustration).concat(yup.object({
	/**
	 * title of the song
	 */
	name: yup.string().required(),
	/*
	 * The slug of the release
	 * To be used with the parent's artist's slug:
	 * ${artistSlug}+${songSlug}
	 */
	slug: yup.string().required(),
	/**
	 * Unique identifier of the parent artist
	 */
	artistId: yup.number().required(),
	/**
	 * Number of times the song has been played
	 */
	playCount: yup.number().required(),
	/**
	 * The ID of the master track
	 */
	masterId: yup.number().required().nullable(),
	/**
	 * Type of song
	 */
	type: yup.mixed<SongType>().oneOf(SongType).required(),
}));

type Song = yup.InferType<typeof Song>;

type SongInclude = 'artist' | 'lyrics' | 'externalIds' | 'featuring';

const SongRelations = yup.object({
	artist: Artist.required(),
	featuring: yup.array(Artist.required()).required(),
	lyrics: Lyrics.required().nullable(),
	externalIds: yup.array(ExternalId.required()).required()
});

const SongWithRelations = <Selection extends SongInclude | never = never>(
	relation: Selection[]
) => Song.concat(SongRelations.pick(relation));

type SongWithRelations<Selection extends SongInclude | never = never> =
	yup.InferType<ReturnType<typeof SongWithRelations<Selection>>>

export default Song;
export const SongSortingKeys = [
	'name',
	'playCount',
	'artistName',
	'addDate'
] as const;
export { type SongInclude, SongWithRelations, SongRelations };
