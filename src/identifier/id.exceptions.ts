import { InvalidRequestException } from "src/exceptions/meelo-exception";

export default class InvalidIdParsingInput extends InvalidRequestException {
	constructor(badInput: string) {
		super(`Parsing Resource's ID failed, expected a number, got '${badInput}'`);
	}
}