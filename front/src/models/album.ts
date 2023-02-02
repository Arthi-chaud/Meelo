import Artist from "./artist";
import Illustration from "./illustration";
import Resource from "./resource";

/**
 * A abstact data model 'instanciated' by releases
 */
type Album = Resource & Illustration & {
	/**
	 * The name of the album
	 */
	name: string;
	/**
	 * The slug of the album
	 * To be used with the parent's artist's slug:
	 * ${artistSlug}+${albumSlug}
	 */
	slug: string;
	/**
	 * The date of the first release of the album
	 * If unknown, the field is set to undefined
	 */
	releaseDate?: Date;
	/**
	 * Type of the album
	 */
	type: AlbumType;
	/**
	 * Unique identifier of the parent artist
	 * If undefined, the album is a compilation
	 */
	artistId?: number;
	/**
	 * Unique identifier of the master release
	 * If undefined, the first related release is chosen
	 */
	masterId?: number;
}

type AlbumInclude = 'artist';

type AlbumWithRelations<I extends AlbumInclude> = Album & Pick<
	{ artist: Artist | null },
	I
>

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

export default Album;
export const AlbumSortingKeys = [
	'name',
	'artistName',
	'releaseDate',
	'addDate'
] as const;
export type { AlbumWithRelations, AlbumInclude };
