import { z } from "zod";
import Resource from "./resource";

const Library = Resource.and(z.object({
	/**
	 * Title of the library
	 */
	name: z.string(),
	/**
	 * Slug of the library
	 * Unique identifier
	 */
	slug: z.string()
}));

type Library = z.infer<typeof Library>;

export default Library;
