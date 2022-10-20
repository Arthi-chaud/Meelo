import { Library } from "src/prisma/models";
import type Slug from "src/slug/slug";
import type { RequireExactlyOne } from 'type-fest';
import type { SearchStringInput } from "src/utils/search-string-input";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include" ;
import BaseSortingParameter from 'src/sort/models/sorting-parameter';
import ParseBaseSortingParameterPipe from 'src/sort/sort.pipe';
import { ApiPropertyOptional } from "@nestjs/swagger";

namespace LibraryQueryParameters {

	/**
	 * Parameters required to create a Library
	 */
	export type CreateInput = Omit<Library, 'id' | 'slug' | 'files'>;

	/**
	 * The Query parameters to get a library
	 */
	export type WhereInput = RequireExactlyOne<{
		id: number,
		slug: Slug
	}>;

	/**
	 * The Query parameters to get multiple libraries
	 */
	export type ManyWhereInput = Partial<RequireExactlyOne<{
		byName: SearchStringInput
	}>>;

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
	export const AvailableIncludes = ['files'] as const;
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;
	

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = ['id', 'name', 'fileCount', 'addDate'] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends BaseSortingParameter<SortingKeys>{
		@ApiPropertyOptional({ enum: SortingKeys })
		sortBy: SortingKeys[number]
	}
	export const ParseSortingParameterPipe = new ParseBaseSortingParameterPipe(SortingKeys);
}

export default LibraryQueryParameters;