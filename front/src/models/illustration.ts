import * as yup from 'yup';

const Illustration = yup.object({
	illustration: yup.object({
		// URL to the illustration
		url: yup.string().required(),
		/**
		 * Blurhash value of the illustration
		 */
		blurhash: yup.string().required(),
		colors: yup.array(yup.string().required()).required()
	}).required().nullable()
});

type Illustration = yup.InferType<typeof Illustration>['illustration'];

export default Illustration;
