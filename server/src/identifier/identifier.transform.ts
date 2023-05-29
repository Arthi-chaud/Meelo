import { applyDecorators } from "@nestjs/common";
import Identifier from "./models/identifier";
import { Transform } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

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
		ApiPropertyOptional({ type: String }),
		Transform(({ value }) => {
			if (!value.length) {
				return undefined;
			}
			const stringValue = value as string;

			if (isNaN(+stringValue)) {
				return service.formatIdentifierToWhereInput(stringValue.replace(/\s+/, '+'));
			}
			return service.formatIdentifierToWhereInput(parseInt(stringValue));
		})
	);
}
