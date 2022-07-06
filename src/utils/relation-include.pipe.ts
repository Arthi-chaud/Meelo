import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import { InvalidRequestException } from "src/exceptions/meelo-exception";

export class InvalidRelationIncludeParameter extends InvalidRequestException {
	constructor() {
		super("The requested include is not valid. Expected format: 'field1,field2,field3'.")
	}
}

export class ParseRelationIncludePipe<Keys extends readonly string[], T = Record<Keys[number], number>> implements PipeTransform {
	constructor(private readonly keys: Keys) { }
	transform(value: any, _metadata: ArgumentMetadata): T {
		const separator = ',';
		let includes: T = <T>{};
		if (value === undefined)
			return includes;

		if (value.match(`[a-zA-Z]+(${separator}[a-zA-Z]+)*`) == null)
			throw new InvalidRelationIncludeParameter();

		(this.keys as unknown as (keyof T)[]).forEach(
			(key: keyof T) => { includes = { ...includes, [key]: false } }
		);
		value.split(separator)
			.forEach((requestedInclude: string) => {
				if (this.keys.includes(requestedInclude) == false)
					throw new BadRequestException(`The key '${requestedInclude}' does not exist. Available keys are: ${this.keys}`);
				includes = {
					...includes,
					[requestedInclude]: true
				}
			});
		return includes;
	}
}
