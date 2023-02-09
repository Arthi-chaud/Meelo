import { z } from "zod";
import Resource from "./resource";

const Genre = Resource.and(z.object({
	/**
	 * Name of the genre
	 */
	name: z.string(),
	/**
	 * Unique identifier as a string
	 */
	slug: z.string(),
}));

export const GenreSortingKeys = ['name', 'songCount'] as const;

export default Genre;
