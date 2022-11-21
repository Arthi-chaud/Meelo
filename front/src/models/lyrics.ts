import Resource from "./resource";

type Lyrics = Resource & {
	/**
	 * Raw lyrics, with '\n' as line seperator
	 */
	content: string;
	/**
	 * Unique identifier of the parent song
	 */
	songId: number
}

export default Lyrics;
