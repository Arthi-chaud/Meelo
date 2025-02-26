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
import { ParsingService } from "src/identifier/identifier.transform";
import Identifier, { castIdentifier } from "src/identifier/models/identifier";
import { RequireExactlyOne } from "type-fest";

export type Filter<T> = RequireExactlyOne<{
	is: T;
	not: T;
	and: T[];
	or: T[];
}>;
// We'll support recursion later

export const filterToPrisma = <T, R>(
	f: Filter<T>,
	tToPrisma: (t: T) => R,
): R | Partial<{ NOT: R; AND: R[]; OR: R[] }> => {
	return {
		...(f.is ? tToPrisma(f.is) : {}),
		NOT: f.not ? tToPrisma(f.not) : undefined,
		OR: f.or ? f.or.map(tToPrisma) : undefined,
		AND: f.and ? f.and.map(tToPrisma) : undefined,
	};
};

const parseFilter = <T>(
	s: string,
	tParser: (i: Identifier) => T,
): Filter<T> => {
	if (s.startsWith("not:")) {
		s = s.slice(4);
		return { not: tParser(castIdentifier(s)) };
	}
	if (s.startsWith("and:")) {
		s = s.slice(4);
		return { and: s.split(",").map((s1) => tParser(castIdentifier(s1))) };
	}
	if (s.startsWith("or:")) {
		s = s.slice(3);
		return { or: s.split(",").map((s1) => tParser(castIdentifier(s1))) };
	}
	return { is: tParser(castIdentifier(s)) };
};

/**
 * Decorator for filter  as query params.
 * Transforms it into a Filter<WhereInput>
 * @param service the servce that has a static method to parse identifier
 */
export default function TransformFilter<
	WhereInput,
	Service extends ParsingService<WhereInput>,
>(service: Service, { description }: { description: string }) {
	return applyDecorators(
		ApiPropertyOptional({
			type: String,
			description: description,
			example:
				'Slug/Id or "and:slug1,slug2" or "or:slug1,slug2" or "not:slug1".',
		}),
		Transform(({ value }) => {
			if (!value.length) {
				return undefined;
			}
			return parseFilter(value, service.formatIdentifierToWhereInput);
		}),
	);
}
