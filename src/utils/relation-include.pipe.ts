// import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
// import { InvalidRequestException } from "src/exceptions/meelo-exception";

// export class InvalidRelationIncludeParameter extends InvalidRequestException {
// 	constructor() {
// 		super("The requested include is not valid. Expected format: 'field1,field2,field3'.")
// 	}
// }

// @Injectable()
// export class ParseRelationIncludePipe<Keys extends string[], T = Partial<Map<Keys[number], boolean>>> implements PipeTransform {
// 	constructor(private keys: Keys) {}
// 	transform(value: string, _metadata: ArgumentMetadata): T  {
// 		const separator = ',';

// 		if (value.match(`[a-zA-Z]+(${separator}[a-zA-Z]+)*`) == null)
// 			throw new InvalidRelationIncludeParameter();

// 		let includes: T;
		
// 		value.split(separator)
// 			.forEach((requestedInclude: string) => {
// 				if (this.keys.includes(requestedInclude) == false)
// 					throw new BadRequestException(`The key '${requestedInclude}' does not exist. Available keys are: ${this.keys}`);
// 				includes[requestedInclude] = false;
// 			});
// 		return includes;
// 	}
// }

// type Constructor<T> = { new (...args: any): T }import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
// import { InvalidRequestException } from "src/exceptions/meelo-exception";

// export class InvalidRelationIncludeParameter extends InvalidRequestException {
// 	constructor() {
// 		super("The requested include is not valid. Expected format: 'field1,field2,field3'.")
// 	}
// }

// @Injectable()
// export class ParseRelationIncludePipe<Keys extends string[], T = Partial<Map<Keys[number], boolean>>> implements PipeTransform {
// 	constructor(private keys: Keys) {}
// 	transform(value: string, _metadata: ArgumentMetadata): T  {
// 		const separator = ',';

// 		if (value.match(`[a-zA-Z]+(${separator}[a-zA-Z]+)*`) == null)
// 			throw new InvalidRelationIncludeParameter();

// 		let includes: T;
		
// 		value.split(separator)
// 			.forEach((requestedInclude: string) => {
// 				if (this.keys.includes(requestedInclude) == false)
// 					throw new BadRequestException(`The key '${requestedInclude}' does not exist. Available keys are: ${this.keys}`);
// 				includes[requestedInclude] = false;
// 			});
// 		return includes;
// 	}
// }
