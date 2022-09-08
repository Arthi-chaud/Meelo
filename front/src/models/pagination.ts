import Resource from "./resource";

/**
 * Parameters for pagination in API requests
 */
type PaginationParameters = Partial<{
	/**
	 * The index of the page to fetch
	 */
	index: number;
	/**
	 * The number of elements in a page
	 */
	pageSize: number;
}>

type PaginatedResponse<T> = {
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
		/**
		 * The current page number
		 */
		page: number;
	}
}

export type { PaginatedResponse, PaginationParameters };