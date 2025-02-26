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

import {
	type ArgumentMetadata,
	Param,
	type PipeTransform,
} from "@nestjs/common";
import { ApiParam } from "@nestjs/swagger";
import type Identifier from "./models/identifier";
import { castIdentifier } from "./models/identifier";

type ParsingService<WhereInput> = {
	formatIdentifierToWhereInput: (identifier: Identifier) => WhereInput;
};

/**
 * Controller method decorator to describe 'idOrSlug' route parameter
 */
export function ApiIdentifierRoute() {
	return ApiParam({
		name: "idOrSlug",
		description:
			"Identifier of the resource to fetch. Can be a number or a slug. <br><br>\
		Examples: 123, 'artist-slug'",
	});
}

/**
 * Parameter decorator for route controllers.
 * Pipes an 'idOrSlug' into a WhereInput
 * @param service the servce that has a static method to parse identifier
 */
export default function IdentifierParam<
	WhereInput,
	Service extends ParsingService<WhereInput>,
>(service: Service) {
	/**
	 * Creates anonymous class here to avoid having to handle types
	 */
	class IdentifierPipe implements PipeTransform {
		transform(value: string, _metadata: ArgumentMetadata) {
			return service.formatIdentifierToWhereInput(castIdentifier(value));
		}
	}

	return (target: any, functionName: string, parameterIndex: number) => {
		const descriptor = Reflect.getOwnPropertyDescriptor(
			target,
			functionName,
		)!;

		ApiIdentifierRoute()(target, functionName, descriptor);
		return Param("idOrSlug", new IdentifierPipe())(
			target,
			functionName,
			parameterIndex,
		);
	};
}
