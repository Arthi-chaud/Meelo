import { z } from "zod";
import Resource from "./resource";

const File = Resource.and(z.object({
	/**
	 * Path of the track, relative to the parent library
	 */
	path: z.string(),
	/**
	 * MD5 checksum of the file
	 */
	md5Checksum: z.string(),
	/**
	 * Date of the file registration
	 */
	registerDate: z.date(),
	/**
	 * ID of the library
	 */
	libraryId: z.number(),
}));

type File = z.infer<typeof File>;

export default File;
