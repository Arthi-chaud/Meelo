import Resource from "./resource";

type Genre = Resource & {
	/**
	 * Name of the genre
	 */
	name: string;
	/**
	 * Unique identifier as a string
	 */
	slug: string;
}

export default Genre;