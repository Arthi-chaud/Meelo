import * as yup from "yup";
import Resource from "./resource";

const Area = Resource.concat(
	yup.object({
		name: yup.string().required(),
		parentId: yup.number().required().nullable(),
	}),
);

type Area = yup.InferType<typeof Area>;

export { Area };
