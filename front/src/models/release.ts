import Album from "./album";
import Illustration from "./illustration";
import Resource from "./resource";

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
	 * Unique identifier of the parent album
	 */
	albumId: number;
	/**
	 * Date the release was *released*
	 */
	releaseDate?: Date;
}

type ReleaseInclude = 'album';

type ReleaseWithRelations<I extends ReleaseInclude> = Release & Pick<
	{ album: Album },
	I
>;

export default Release;
export const ReleaseSortingKeys = [
	'name',
	'releaseDate',
	'trackCount',
	'addDate'
] as const;
export type { ReleaseWithRelations, ReleaseInclude };
