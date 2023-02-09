import { z } from "zod";
import Artist from "./artist";
import Illustration from "./illustration";
import Resource from "./resource";

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

const Album = z.intersection(
	Resource,
	Illustration
).and(z.object({
	/**
	 * The name of the album
	 */
	name: z.string(),
	/**
	 * The slug of the album
	 * To be used with the parent's artist's slug:
	 * ${artistSlug}+${albumSlug}
	 */
	slug: z.string(),
	/**
	 * The date of the first release of the album
	 * If unknown, the field is set to undefined
	 */
	releaseDate: z.date().nullable(),
	/**
	 * Type of the album
	 */
	type: z.enum(AlbumType),
	/**
	 * Unique identifier of the parent artist
	 * If undefined, the album is a compilation
	 */
	artistId: z.number().nullable(),
	/**
	 * Unique identifier of the master release
	 * If undefined, the first related release is chosen
	 */
	masterId: z.number().nullable()
}));

type Album = z.infer<typeof Album>;

type AlbumInclude = 'artist';

type AlbumWithRelations<I extends K[], K extends AlbumInclude = AlbumInclude> = Album & Pick<
	{ artist: Artist | null },
	I[number]
>

export default Album;
export const AlbumSortingKeys = [
	'name',
	'artistName',
	'releaseDate',
	'addDate'
] as const;
export type { AlbumWithRelations, AlbumInclude };
