import { Prisma } from "@prisma/client";
import { RequireExactlyOne } from "type-fest";

export type SearchStringInput = RequireExactlyOne<{ startsWith: string, endsWith: string, contains: string, is: string }>;

export function buildStringSearchParameters(where?: SearchStringInput) {
	return {
		startsWith: where?.startsWith,
		endsWith: where?.endsWith,
		contains: where?.contains,
		equals: where?.is,
		mode: Prisma.QueryMode.insensitive
	};
}
