import Artist from "./artist";
import Illustration from "./illustration";
import Release from "./release";
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
	type: 'StudioRecording' | 'LiveRecording' | 'Compilation' | 'Single';
	/**
	 * Unique identifier of the parent artist
	 * If undefined, the album is a compilation
	 */
	artistId?: number;
}

type AlbumWithArtist = Album & {
	artist?: Artist;
}

type AlbumWithReleases = Album & {
	releases: Release[];
}

type AlbumInclude = 'artist' | 'releases';

export const AlbumType = ['StudioRecording', 'Single', 'LiveRecording', 'Compilation'];
export type AlbumType = 'StudioRecording' | 'LiveRecording' | 'Compilation' | 'Single';

export default Album;
export const AlbumSortingKeys = ['name', 'artistName', 'releaseDate', 'addDate'];
export type { AlbumWithArtist, AlbumWithReleases, AlbumInclude };