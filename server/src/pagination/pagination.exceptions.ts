import { InvalidRequestException } from "src/exceptions/meelo-exception";
import type { PaginationParameters } from "./models/pagination-parameters";

export default class InvalidPaginationParameterValue extends InvalidRequestException {
	constructor(key: keyof PaginationParameters) {
		super(`Invalid '${key}' parameter: expected positive integer`);
	}
}
