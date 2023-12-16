import { Library } from "src/prisma/models";
import type Slug from "src/slug/slug";
import type { RequireExactlyOne } from "type-fest";
import type { SearchStringInput } from "src/utils/search-string-input";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";

namespace LibraryQueryParameters {
	/**
	 * Parameters required to create a Library
	 */
	export type CreateInput = Omit<Library, "id" | "slug" | "files">;

	/**
	 * The Query parameters to get a library
	 */
	export type WhereInput = RequireExactlyOne<{
		id: Library["id"];
		slug: Slug;
	}>;

	/**
	 * The Query parameters to get multiple libraries
	 */
	export type ManyWhereInput = Partial<
		RequireExactlyOne<{
			name: SearchStringInput;
			id: { in: number[] };
		}>
	>;

	/**
	 * The Query parameters to update a library
	 */
	export type UpdateInput = Partial<CreateInput>;

	/**
	 * The Query Parameters to delete a library
	 */
	export type DeleteInput = WhereInput;

	/**
	 * The relation field to include in a returned library
	 */
	export const AvailableIncludes = ["files"] as const;
	export const AvailableAtomicIncludes =
		filterAtomicRelationInclude(AvailableIncludes);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = ["id", "name", "fileCount", "addDate"] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default LibraryQueryParameters;
