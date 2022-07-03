// import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
// import { InvalidRequestException } from "src/exceptions/meelo-exception";

// export class InvalidRelationIncludeParameter extends InvalidRequestException {
// 	constructor() {
// 		super("The requested include is not valid. Expected format: 'field1,field2,field3'.")
// 	}
// }

// @Injectable()
// export class ParseRelationIncludePipe<T, K = keyof T extends readonly string[]> implements PipeTransform {
// 	transform(value: any, _metadata: ArgumentMetadata) {
// 		const separator = ',';

// 		if (value.match(`[a-zA-Z]+(${separator}[a-zA-Z]+)*`) == null)
// 			throw new InvalidRelationIncludeParameter();
// 		let includes: Record<K, boolean>;
// 		const requestedIncludes = (value as string)
// 			.split(separator)
// 			.map((req) => req.toLocaleLowerCase());
// 		for (const requestedInclude of requestedIncludes) {
// 			if ()
// 		}
		
// 	}
// }