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

export default Artist;
export const ArtistSortingKeys = [
	'name',
	'albumCount',
	'songCount'
] as const;

