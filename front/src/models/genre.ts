import * as yup from 'yup';
import Resource from "./resource";

const Genre = Resource.concat(yup.object({
	/**
	 * Name of the genre
	 */
	name: yup.string().required(),
	/**
	 * Unique identifier as a string
	 */
	slug: yup.string().required(),
}));

export type Genre = yup.InferType<typeof Genre>;

export default Genre;

export const GenreSortingKeys = ['name', 'songCount'] as const;
