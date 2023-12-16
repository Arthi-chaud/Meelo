import * as yup from "yup";

const Lyrics = yup.object({
	id: yup.number().required(),
	content: yup.string().required(),
});

export type Lyrics = yup.InferType<typeof Lyrics>;

export default Lyrics;
