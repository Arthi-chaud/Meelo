import * as yup from 'yup';
import Resource from "./resource";

const Library = Resource.concat(yup.object({
	/**
	 * Title of the library
	 */
	name: yup.string().required(),
	/**
	 * Slug of the library
	 * Unique identifier
	 */
	slug: yup.string().required(),
	/**
	 * Path of the library
	 */
	path: yup.string().required(),
}));

type Library = yup.InferType<typeof Library>;

export default Library;
