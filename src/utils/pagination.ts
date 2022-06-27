export type PaginationParameters = Partial<{
	skip: number,
	take: number
}>;

export function buildPaginationParameters(parameters?: PaginationParameters) {
	return parameters ?? {}
};