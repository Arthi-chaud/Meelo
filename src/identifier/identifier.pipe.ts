import {
	ArgumentMetadata, Param, PipeTransform
} from "@nestjs/common";
import { ApiIdentifierRoute } from "./identifier-route.decorator";
import Identifier from "./models/identifier";

type ParsingService<WhereInput> = {
	formatIdentifierToWhereInput: (identifier: Identifier) => WhereInput;
}

/**
 * Parameter decorator for route controllers.
 * Pipes an 'idOrSlug' into a WhereInput
 * @param service the servce that has a static method to parse identifier
 */
export default function IdentifierParam<WhereInput, Service extends ParsingService<WhereInput>>(service: Service) {
	/**
	 * Creates anonymous class here to avoid having to handle types
	 */
	class IdentifierPipe implements PipeTransform {
		transform(value: string, _metadata: ArgumentMetadata) {
			if (isNaN(+value)) {
				return service.formatIdentifierToWhereInput(value);
			}
			return service.formatIdentifierToWhereInput(parseInt(value));
		}
	}

	return function (target: any, functionName: string, parameterIndex: number) {
		const descriptor = Reflect.getOwnPropertyDescriptor(target, functionName)!;

		ApiIdentifierRoute()(target, functionName, descriptor);
		return Param('idOrSlug', new IdentifierPipe())(target, functionName, parameterIndex);
	};
}
