import Resource from "./resource";

type Library = Resource & {
	/**
	 * Display name of the library
	 */
	title: string;
	/**
	 * Slug of the library
	 * Unique identifier
	 */
	slug: string;	
}

export default Library;