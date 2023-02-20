import * as yup from 'yup';

const Lyrics = yup.object({
	lyrics: yup.string().required()
});

export type Lyrics = yup.InferType<typeof Lyrics>;

export default Lyrics;
