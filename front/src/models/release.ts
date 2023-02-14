import * as yup from 'yup';
import Album from "./album";
import Illustration from "./illustration";
import Resource from "./resource";

/**
 * A version of an album
 */
const Release = Resource.concat(Illustration).concat(yup.object({
	/**
	 * The title of the release
	 */
	name: yup.string().required(),
	/**
	 * The unique ID of the release
	 */
	id: yup.number().required(),
	/**
	 * The slug of the release
	 * To be used with the parent's artist's slug and the parent album's slug:
	 * ${artistSlug}+${albumSlug}+${releaseSlug}
	 */
	slug: yup.string().required(),
	/**
	 * Unique identifier of the parent album
	 */
	albumId: yup.number().required(),
	/**
	 * Date the release was *released*
	 */
	releaseDate: yup.date().required().nullable()
}));

type Release = yup.InferType<typeof Release>;

type ReleaseInclude = 'album';

const ReleaseWithRelations = <Selection extends ReleaseInclude | never = never>(
	relation: Selection[]
) => Release.concat(yup.object({
		album: Album.required()
	}).pick(relation));

type ReleaseWithRelations<Selection extends ReleaseInclude | never = never> =
	yup.InferType<ReturnType<typeof ReleaseWithRelations<Selection>>>

export default Release;

export const ReleaseSortingKeys = [
	'name',
	'releaseDate',
	'trackCount',
	'addDate'
] as const;
export type { ReleaseWithRelations, ReleaseInclude };
