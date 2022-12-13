import Album from "./album";
import Illustration from "./illustration";
import Resource from "./resource";
import Track from "./track";

/**
 * A version of an album
 */
type Release = Resource & Illustration & {
	/**
	 * The title of the release
	 */
	name: string;
	/**
	 * The unique ID of the release
	 */
	id: number;
	/**
	 * The slug of the release
	 * To be used with the parent's artist's slug and the parent album's slug:
	 * ${artistSlug}+${albumSlug}+${releaseSlug}
	 */
	slug: string;
	/**
	 * Is the release the 'main' one
	 */
	master: boolean
	/**
	 * Unique identifier of the parent album
	 */
	albumId: number;
	/**
	 * Date the release was *released*
	 */
	releaseDate?: Date;
}

type ReleaseWithAlbum = Release & {
	album: Album;
}

type ReleaseWithTracks = Release & {
	tracks: Track[];
}

type ReleaseInclude = 'album';

export default Release;
export const ReleaseSortingKeys = [
	'name',
	'releaseDate',
	'trackCount',
	'addDate'
] as const;
export type { ReleaseWithAlbum, ReleaseWithTracks, ReleaseInclude };
