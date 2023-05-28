import { applyDecorators } from "@nestjs/common";
import Identifier from "./models/identifier";
import { Transform } from "class-transformer";

type ParsingService<WhereInput> = {
	formatIdentifierToWhereInput: (identifier: Identifier) => WhereInput;
}

/**
 * Decorator for identifiers as query params.
 * Transforms it into a WhereInput
 * @param service the servce that has a static method to parse identifier
 */
export default function TransformIdentifier<WhereInput, Service extends ParsingService<WhereInput>>(service: Service) {
	return applyDecorators(
		Transform(({ value }) => {
			if (!value.length) {
				return undefined;
			}
			if (isNaN(+value)) {
				return service.formatIdentifierToWhereInput(value);
			}
			return service.formatIdentifierToWhereInput(parseInt(value));
		})
	);
}
