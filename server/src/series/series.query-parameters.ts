import { Series } from "src/prisma/models";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import Slug from "src/slug/slug";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import { RequireExactlyOne } from "type-fest";

namespace SeriesQueryParameters {
	export type CreateInput = Pick<Series, "name"> &
		Partial<Pick<Series, "mbid" | "labelId">>;
	export type WhereInput = RequireExactlyOne<{ id: number; slug?: Slug }>;

	export type UpdateInput = Partial<Pick<Series, "mbid" | "labelId">>;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ["label"] as const;
	export const AvailableAtomicIncludes = AvailableIncludes;
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = ["id", "name", "albumCount"] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default SeriesQueryParameters;
