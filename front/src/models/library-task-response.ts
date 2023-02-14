import * as yup from 'yup';

const LibraryTaskResponse = yup.object({
	/**
	 * Status of the task
	 */
	status: yup.string().required()
});

type LibraryTaskResponse = yup.InferType<typeof LibraryTaskResponse>;

export default LibraryTaskResponse;
