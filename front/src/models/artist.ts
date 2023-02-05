import Illustration from "./illustration";
import Resource from "./resource";

type Artist = Resource & Illustration & {
	/**
	 * The name of the artist
	 */
	name: string;
	/**
	 * Slug of the name
	 * Also an identifier of the artist
	 */
	slug: string;
}

export default Artist;
export const ArtistSortingKeys = [
	'name',
	'albumCount',
	'songCount'
] as const;

