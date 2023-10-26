import * as yup from 'yup';
import Album from "./album";
import Illustration from "./illustration";
import Resource from "./resource";
import ExternalId from './external-id';

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

export default Release;

export type ReleaseInclude = 'album' | 'externalIds';

const ReleaseWithRelations = <Selection extends ReleaseInclude | never = never>(
	relation: Selection[]
) => Release.concat(yup.object({
		album: Album.required(),
		externalIds: yup.array(ExternalId.required()).required()
	}).pick(relation));

type ReleaseWithRelations<Selection extends ReleaseInclude | never = never> =
	yup.InferType<ReturnType<typeof ReleaseWithRelations<Selection>>>

export { ReleaseWithRelations };

export const ReleaseSortingKeys = [
	'name',
	'releaseDate',
	'trackCount',
	'addDate'
] as const;
