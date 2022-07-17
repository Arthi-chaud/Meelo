export type PaginationParameters = Partial<{
	skip: number,
	take: number
}>;

export function buildPaginationParameters(parameters?: PaginationParameters) {
	return parameters ?? {}
};

/**
 * Default number of elements to take
 */
export const defaultPageSize = 20;
