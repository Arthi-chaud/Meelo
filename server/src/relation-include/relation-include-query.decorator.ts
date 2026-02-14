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

import { Query } from "@nestjs/common";
import ParseBaseRelationIncludePipe from "src/relation-include/relation-include.pipe";
import "reflect-metadata";
import { ApiRelationInclude } from "./relation-include-route.decorator";

/**
 * Query parame decorator to parse relation includes
 * @param keys
 * @returns
 */
export default function RelationIncludeQuery(keys: readonly string[]) {
	return (target: any, functionName: string, parameterIndex: number) => {
		if (keys.length !== 0) {
			const descriptor = Reflect.getOwnPropertyDescriptor(
				target,
				functionName,
			)!;

			ApiRelationInclude(keys)(target, functionName, descriptor);
		}
		return Query("with", new ParseBaseRelationIncludePipe(keys))(
			target,
			functionName,
			parameterIndex,
		);
	};
}
