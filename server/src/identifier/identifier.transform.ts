/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { applyDecorators } from "@nestjs/common";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import type Identifier from "./models/identifier";
import { castIdentifier } from "./models/identifier";

export type ParsingService<WhereInput> = {
	formatIdentifierToWhereInput: (identifier: Identifier) => WhereInput;
};

/**
 * Decorator for identifiers as query params.
 * Transforms it into a WhereInput
 * @param service the servce that has a static method to parse identifier
 */
export default function TransformIdentifier<
	WhereInput,
	Service extends ParsingService<WhereInput>,
>(service: Service) {
	return applyDecorators(
		ApiPropertyOptional({ type: String }),
		Transform(({ value }) => {
			if (!value.length) {
				return undefined;
			}
			return service.formatIdentifierToWhereInput(
				castIdentifier(value as string),
			);
		}),
	);
}
