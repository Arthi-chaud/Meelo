import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import { InvalidRequestException } from "src/exceptions/meelo-exception";

export class InvalidRelationIncludeParameterFormat extends InvalidRequestException {
	constructor() {
		super("Parsing requested includes failed: The requested include is not valid. Expected format: 'field1,field2,field3'.")
	}
}

export class InvalidRelationIncludeParameter extends InvalidRequestException {
	constructor(requestedInclude: string, availableIncludes: readonly string[]) {
		super(`Parsing requested includes failed: The field '${requestedInclude}' does not exist. Available fields are: [${availableIncludes}]`);
	}
}

export class ParseRelationIncludePipe<Keys extends readonly string[], T = Record<Keys[number], number>> implements PipeTransform {
	constructor(private readonly keys: Keys) { }
	transform(value: any, _metadata: ArgumentMetadata): T {
		const separator = ',';
		let includes: T = <T>{};
		if (value === undefined || value === "")
			return includes;

		if (value.match(`[a-zA-Z]+(${separator}[a-zA-Z]+)*`) == null)
			throw new InvalidRelationIncludeParameterFormat();

		(this.keys as unknown as (keyof T)[]).forEach(
			(key: keyof T) => { includes = { ...includes, [key]: false } }
		);
		value.split(separator)
			.forEach((requestedInclude: string) => {
				if (this.keys.includes(requestedInclude) == false)
					throw new InvalidRelationIncludeParameter(requestedInclude, this.keys);
				includes = {
					...includes,
					[requestedInclude]: true
				}
			});
		return includes;
	}
}
