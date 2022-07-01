// import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
// import { InvalidRequestException } from "src/exceptions/meelo-exception";

// export class InvalidRelationIncludeParameter extends InvalidRequestException {
// 	constructor() {
// 		super("The requested include is not valid. Expected format: 'field1,field2,field3'.")
// 	}
// }

// @Injectable()
// export class ParseRelationIncludePipe<T, U extends keyof T> implements PipeTransform {
//   transform(value: any, _metadata: ArgumentMetadata): Record<keyof T, boolean> {
// 	const separator = ',';
// 	if (`/[a-zA-Z]+(${separator}[a-zA-Z]+)*/mg`.match(value) == null)
// 		throw new InvalidRelationIncludeParameter();
// 	let includes: Record<U, boolean>;
// 	(Object.keys(<U>{}) as Array<U>).forEach((key: U) => includes[key] = false);
// 	for (const include in value.toString().split(separator)) {
// 		if ((Object.keys(<U>{})).includes(include))

// 	}
// 	return includes as U;
//   }
// }