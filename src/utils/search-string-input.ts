import { Prisma } from "@prisma/client";
import { RequireOnlyOne } from "./require-only-one";

export type SearchStringInput = RequireOnlyOne<{ startsWith: string, endsWith: string, contains: string, is: string }>;

export function buildStringSearchParameters(where?: SearchStringInput) {
	return {
		startsWith: where?.startsWith,
		endsWith: where?.endsWith,
		contains: where?.contains,
		equals: where?.is,
		mode: Prisma.QueryMode.insensitive
	};
}