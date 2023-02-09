import Illustration from "./illustration";
import Resource from "./resource";
import { z } from 'zod';

const Artist = z.intersection(
	Resource,
	Illustration
).and(z.object({
	/**
	 * The name of the artist
	 */
	name: z.string(),
	/**
	 * Slug of the name
	 * Also an identifier of the artist
	 */
	slug: z.string()
}));

type Artist = z.infer<typeof Artist>;

export default Artist;
export const ArtistSortingKeys = [
	'name',
	'albumCount',
	'songCount'
] as const;

