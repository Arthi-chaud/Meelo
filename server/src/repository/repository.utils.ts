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

import { PrismaClient } from "@prisma/client";
import Identifier from "src/identifier/models/identifier";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import Slug from "src/slug/slug";
import { RequireExactlyOne } from "type-fest";

export async function getRandomIds(
	tableName: string,
	prisma: PrismaClient,
	seed: number,
	pagination: PaginationParameters,
): Promise<number[]> {
	const ids = await prisma
		.$queryRawUnsafe(
			`SELECT id FROM ${tableName} ORDER BY MD5(${seed.toString()} || id::text)`,
		)
		.then((res: { id: number }[]) => res.map(({ id }) => id));
	if (pagination?.afterId !== undefined) {
		const indexOfFirstItem = ids.indexOf(pagination.afterId) + 1;
		return ids.slice(indexOfFirstItem, pagination?.take);
	}
	return ids.slice(pagination?.skip, pagination?.take);
}

export function sortItemsUsingOrderedIdList<T extends { id: number }>(
	matches: number[],
	items: T[],
) {
	return items
		.map((item) => ({ item, index: matches.indexOf(item.id) }))
		.sort((item1, item2) => item1.index - item2.index)
		.map(({ item }) => item);
}

/**
 * Format an Identifier into a WhereInput
 * @param identifier the entity unique identifier
 * @param stringToWhereInput the methods to turn string identifier into a WhereInput
 * @param numberToWhereInput the methods to turn numeric identifier into a WhereInput
 * @returns a WhereInput
 */
export function formatIdentifier<RepoWhereInput>(
	identifier: Identifier,
	stringToWhereInput: (id: string) => RepoWhereInput,
	numberToWhereInput?: (id: number) => RepoWhereInput,
): { id: number } | RepoWhereInput {
	if (typeof identifier == "number") {
		if (numberToWhereInput) {
			return numberToWhereInput(identifier);
		}
		return { id: identifier } as RepoWhereInput;
	}
	return stringToWhereInput(identifier);
}

export function formatIdentifierToIdOrSlug(
	identifier: Identifier,
): RequireExactlyOne<{ id: number; slug: Slug }> {
	if (typeof identifier == "number") {
		return { id: identifier };
	}
	return { slug: new Slug(identifier) };
}

export function formatPaginationParameters(
	pagination: PaginationParameters | undefined,
) {
	return {
		take: pagination?.take,
		skip:
			pagination?.afterId !== undefined
				? 1 + (pagination?.skip ?? 0)
				: pagination?.skip,
		cursor:
			pagination?.afterId !== undefined
				? {
						id: pagination.afterId,
				  }
				: undefined,
	};
}
