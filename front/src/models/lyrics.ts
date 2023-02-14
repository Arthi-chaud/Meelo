import * as yup from 'yup';
import Resource from "./resource";

const Lyrics = Resource.concat(yup.object({
	/**
	 * Raw lyrics, with '\n' as line seperator
	 */
	content: yup.string().required(),
	/**
	 * Unique identifier of the parent song
	 */
	songId: yup.number().required(),
}));

type Lyrics = yup.InferType<typeof Lyrics>;

export default Lyrics;
