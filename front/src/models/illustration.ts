import * as yup from 'yup';

const Illustration = yup.object({
	/**
	 * Path of the route of the API to get the illustration
	 */
	illustration: yup.string().required().nullable()
});

type Illustration = yup.InferType<typeof Illustration>;

export default Illustration;
