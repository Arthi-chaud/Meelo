import { z } from "zod";

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

const PaginatedResponse = <T>(itemType: z.ZodType<T>) => z.object({
	items: z.array(itemType),
	metadata: z.object({
		/**
		 * Current route
		 */
		this: z.string(),
		/**
		 * route to use for the next items
		 */
		next: z.string().nullable(),
		/**
		 * route to use for the previous items
		 */
		previous: z.string().nullable(),
		/**
		 * The current page number
		 */
		page: z.number(),
	})
});

type PaginatedResponse<T> = z.infer<ReturnType<typeof PaginatedResponse<T>>>;

export type { PaginatedResponse, PaginationParameters };
