import { z } from "zod";
import Resource from "./resource";

const Lyrics = Resource.and(z.object({
	/**
	 * Raw lyrics, with '\n' as line seperator
	 */
	content: z.string(),
	/**
	 * Unique identifier of the parent song
	 */
	songId: z.number()
}));

type Lyrics = z.infer<typeof Lyrics>;

export default Lyrics;
