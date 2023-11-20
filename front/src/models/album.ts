import * as yup from 'yup';
import Artist from "./artist";
import Illustration from "./illustration";
import Resource from "./resource";
import ExternalId from './external-id';

export const AlbumType = [
	'StudioRecording',
	'Single',
	'LiveRecording',
	'Compilation',
	'Soundtrack',
	'RemixAlbum',
	'VideoAlbum'
] as const;

export type AlbumType = typeof AlbumType[number];

const Album = Resource.concat(Illustration).concat(yup.object({
	/**
	 * The name of the album
	 */
	name: yup.string().required(),
	/**
	 * The slug of the album
	 * To be used with the parent's artist's slug:
	 * ${artistSlug}+${albumSlug}
	 */
	slug: yup.string().required(),
	/**
	 * The date of the first release of the album
	 * If unknown, the field is set to undefined
	 */
	releaseDate: yup.date().required().nullable(),
	/**
	 * Type of the album
	 */
	type: yup.mixed<AlbumType>().oneOf(AlbumType).required(),
	/**
	 * Unique identifier of the parent artist
	 * If undefined, the album is a compilation
	 */
	artistId: yup.number().required().nullable(),
	/**
	 * Unique identifier of the master release
	 * If undefined, the first related release is chosen
	 */
	masterId: yup.number().required().nullable()
}));

type Album = yup.InferType<typeof Album>;

export default Album;

export type AlbumInclude = 'artist' | 'externalIds';

const AlbumWithRelations = <Selection extends AlbumInclude | never = never>(
	relation: Selection[]
) => Album.concat(yup.object({
		artist: Artist.required().nullable(),
		externalIds: yup.array(ExternalId.required().concat(yup.object({
			rating: yup.number().required().nullable()
		}))).required()
	}).pick(relation));

type AlbumWithRelations<Selection extends AlbumInclude | never = never> =
	yup.InferType<ReturnType<typeof AlbumWithRelations<Selection>>>

export const AlbumSortingKeys = [
	'name',
	'artistName',
	'releaseDate',
	'addDate'
] as const;
export { AlbumWithRelations };
