import * as yup from "yup";
import Resource from "./resource";

/**
 * 'Instance' of a song on a release
 */
const Series = Resource.concat(
	yup.object({
		id: yup.number().required(),
		slug: yup.string().required(),
		name: yup.string().required(),
		index: yup.number().nullable(),
	}),
);

type Series = yup.InferType<typeof Series>;

export default Series;
