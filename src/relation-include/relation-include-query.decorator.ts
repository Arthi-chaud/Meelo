import { Query } from "@nestjs/common";
import ParseBaseRelationIncludePipe from 'src/relation-include/relation-include.pipe';
import "reflect-metadata";
import { ApiRelationInclude } from "./relation-include-route.decorator";

/**
 * Query parame decorator to parse relation includes
 * @param keys
 * @returns
 */
export default function RelationIncludeQuery(keys: readonly string[]) {
	return function (target: any, functionName: string, parameterIndex: number) {
		if (keys.length != 0) {
			const descriptor = Reflect.getOwnPropertyDescriptor(target, functionName)!;

			if (descriptor) {
				const method = descriptor.value;

				if (method instanceof Function) {
					descriptor.value = ApiRelationInclude(keys)(target, functionName, descriptor);
				}
				Object.defineProperty(target, functionName, descriptor);
			}
		}
		return Query('with', new ParseBaseRelationIncludePipe(keys))(target, functionName, parameterIndex);
	};
}
