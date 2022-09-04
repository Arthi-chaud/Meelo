import Resource from "./resource";

type Library = Resource & {
	/**
	 * Title of the library
	 */
	name: string;
	/**
	 * Slug of the library
	 * Unique identifier
	 */
	slug: string;	
}

export default Library;