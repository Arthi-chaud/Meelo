import * as yup from 'yup';

const Resource = yup.object({
	/**
	 * Unique identifier
	 */
	id: yup.number().required()
});

type Resource = yup.InferType<typeof Resource>;

export default Resource;
