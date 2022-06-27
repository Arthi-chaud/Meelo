export type PaginationParameters = Partial<{
	skip: number,
	take: number
}>;

export function buildPaginationParamters(parameters?: PaginationParameters) {
	return parameters ?? {}
};