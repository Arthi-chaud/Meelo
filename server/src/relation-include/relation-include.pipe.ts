import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import type { RelationInclude } from "./models/relation-include";
import {
	InvalidRelationIncludeParameter,
	InvalidRelationIncludeParameterFormat,
} from "./relation-include.exceptions";

/**
 * Pipe to parse relation clude request from query parameter
 * The expected format is `field1,field2,field3,...`
 * Constructor parameter is the array of valid, available keys
 */
export default class ParseRelationIncludePipe<
	Keys extends readonly string[],
	T = RelationInclude<Keys>,
> implements PipeTransform
{
	constructor(private readonly keys: Keys) {}
	transform(value: any, _metadata: ArgumentMetadata): T {
		const separator = ",";
		let includes: T = <T>{};
		const keysArray = this.keys as unknown as (keyof T)[];

		if (value === undefined || value === "") {
			return includes;
		}
		if (value.match(`[a-zA-Z]+(${separator}[a-zA-Z]+)*`) == null) {
			throw new InvalidRelationIncludeParameterFormat();
		}
		keysArray.forEach((key: keyof T) => {
			includes = { ...includes, [key]: false };
		});
		value.split(separator).forEach((requestedInclude: string) => {
			if (this.keys.includes(requestedInclude) == false) {
				throw new InvalidRelationIncludeParameter(
					requestedInclude,
					this.keys,
				);
			}
			includes = { ...includes, [requestedInclude]: true };
		});
		return includes;
	}
}
