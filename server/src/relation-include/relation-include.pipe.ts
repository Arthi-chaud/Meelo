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

import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import type { RelationInclude } from "./models/relation-include";
import {
	InvalidRelationIncludeParameter,
	InvalidRelationIncludeParameterFormat,
} from "./relation-include.exceptions";

/**
 * Pipe to parse relation clude request from query parameter
 * The expected format is `field1,field2,field3,...`
 * Constructor parameter is the array of valid, available keys
 */
export default class ParseRelationIncludePipe<
	Keys extends readonly string[],
	T = RelationInclude<Keys>,
> implements PipeTransform
{
	constructor(private readonly keys: Keys) {}
	transform(value: any, _metadata: ArgumentMetadata): T {
		const separator = ",";
		let includes: T = <T>{};
		const keysArray = this.keys as unknown as (keyof T)[];

		if (value === undefined || value === "") {
			return includes;
		}
		if (value.match(`[a-zA-Z]+(${separator}[a-zA-Z]+)*`) == null) {
			throw new InvalidRelationIncludeParameterFormat();
		}
		for (const key of keysArray) {
			includes = { ...includes, [key]: false };
		}
		for (const requestedInclude of value.split(separator)) {
			if (this.keys.includes(requestedInclude) === false) {
				throw new InvalidRelationIncludeParameter(
					requestedInclude,
					this.keys,
				);
			}
			includes = { ...includes, [requestedInclude]: true };
		}
		return includes;
	}
}
