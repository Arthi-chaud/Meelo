import { Query } from "@nestjs/common";
import ParsePaginationParameterPipe from "./pagination.pipe";

/**
 * Decorator for the pagination query parameter
 */
export function PaginationQuery() {
	return Query(ParsePaginationParameterPipe)
}