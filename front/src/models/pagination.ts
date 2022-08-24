import Resource from "./resource";

/**
 * Parameters for pagination in API requests
 */
type PaginationParameters = Partial<{
	/**
	 * The number of elements to take
	 */
	take: number;
	/**
	 * The number of elements to skip before taking the elements
	 */
	skip: number;
}>

type PaginatedResponse<T extends Resource> = {
	items: T[];
	metadata: {
		/**
		 * Current route
		 */
		this: string;
		/**
		 * route to use for the next items
		 */
		next: string | null;
		/**
		 * route to use for the previous items
		 */
		previous: string | null;
	}
}

export type { PaginatedResponse, PaginationParameters };