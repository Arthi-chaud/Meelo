import * as yup from 'yup';
import Resource from "./resource";

const File = Resource.concat(yup.object({
	/**
	 * Path of the track, relative to the parent library
	 */
	path: yup.string().required(),
	/**
	 * MD5 checksum of the file
	 */
	md5Checksum: yup.string().required(),
	/**
	 * Date of the file registration
	 */
	registerDate: yup.date().required(),
	/**
	 * ID of the library
	 */
	libraryId: yup.number().required(),
}));

type File = yup.InferType<typeof File>;

export default File;
