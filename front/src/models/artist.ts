import ExternalId from "./external-id";
import Illustration from "./illustration";
import Resource from "./resource";
import * as yup from 'yup';

const Artist = Resource.concat(Illustration).concat(yup.object({
	/**
	 * The name of the artist
	 */
	name: yup.string().required(),
	/**
	 * Slug of the name
	 * Also an identifier of the artist
	 */
	slug: yup.string().required()
}));

type Artist = yup.InferType<typeof Artist>;

export type ArtistInclude = 'externalIds';

const ArtistWithRelations = <Selection extends ArtistInclude | never = never>(
	relation: Selection[]
) => Artist.concat(yup.object({
		externalIds: yup.array(ExternalId.required()).required()
	}).pick(relation));

type ArtistWithRelations<Selection extends ArtistInclude | never = never> =
	yup.InferType<ReturnType<typeof ArtistWithRelations<Selection>>>

export default Artist;

export const ArtistSortingKeys = [
	'name',
	'albumCount',
	'songCount'
] as const;

export { ArtistWithRelations };
