import Resource from "./resource";

type File = Resource & {
	/**
	 * Path of the track, relative to the parent library
	 */
	path: string;
	/**
	 * MD5 checksum of the file
	 */
	md5Checksum: string;
	/**
	 * Date of the file registration
	 */
	registerDate: Date;

	/**
	 * ID of the library
	 */
	libraryId: number;
}

export default File;
