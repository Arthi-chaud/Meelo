import * as yup from 'yup';

/**
 * Parameters for pagination in API requests
 */
export type PaginationParameters = Partial<{
	/**
	 * The index of the last item of the previou page
	 */
	afterId: number;
	/**
	 * The number of elements in a page
	 */
	pageSize: number;
}>

const PaginatedResponse = <T>(itemType: yup.Schema<T>) => yup.object({
	items: yup.array(itemType).required(),
	metadata: yup.object({
		/**
		 * Current route
		 */
		this: yup.string().required(),
		/**
		 * route to use for the next items
		 */
		next: yup.string().required().nullable(),
		/**
		 * route to use for the previous items
		 */
		previous: yup.string().required().nullable(),
		/**
		 * The current page number
		 */
		page: yup.number().required().nullable(),
	})
});

type PaginatedResponse<T> = yup.InferType<ReturnType<typeof PaginatedResponse<T>>>;

export default PaginatedResponse;
