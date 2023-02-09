import { z } from "zod";
import Album from "./album";
import Illustration from "./illustration";
import Resource from "./resource";

/**
 * A version of an album
 */
const Release = z.intersection(
	Resource,
	Illustration,
).and(z.object({
	/**
	 * The title of the release
	 */
	name: z.string(),
	/**
	 * The unique ID of the release
	 */
	id: z.number(),
	/**
	 * The slug of the release
	 * To be used with the parent's artist's slug and the parent album's slug:
	 * ${artistSlug}+${albumSlug}+${releaseSlug}
	 */
	slug: z.string(),
	/**
	 * Unique identifier of the parent album
	 */
	albumId: z.number(),
	/**
	 * Date the release was *released*
	 */
	releaseDate: z.date().nullable()
}));

type Release = z.infer<typeof Release>;

type ReleaseInclude = 'album';

type ReleaseWithRelations<
	I extends K[],
	K extends ReleaseInclude = ReleaseInclude
> = Release & Pick<
	{ album: Album },
	I[number]
>;

type B = ReleaseWithRelations<any>['album'];

export default Release;
export const ReleaseSortingKeys = [
	'name',
	'releaseDate',
	'trackCount',
	'addDate'
] as const;
export type { ReleaseWithRelations, ReleaseInclude };
