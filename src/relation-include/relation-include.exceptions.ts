import { InvalidRequestException } from "src/exceptions/meelo-exception";

export class InvalidRelationIncludeParameterFormat extends InvalidRequestException {
	constructor() {
		super(
			"Parsing requested includes failed: The requested include is not valid. Expected format: 'field1,field2,field3'."
		);
	}
}

export class InvalidRelationIncludeParameter extends InvalidRequestException {
	constructor(requestedInclude: string, availableIncludes: readonly string[]) {
		super(`Parsing requested includes failed: The field '${requestedInclude}' does not exist. Available fields are: [${availableIncludes}]`);
	}
}
