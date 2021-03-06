import { Library, Prisma } from "@prisma/client";
import type Slug from "src/slug/slug";
import type OmitId from "src/utils/omit-id";
import type OmitSlug from "src/utils/omit-slug";
import type RequireOnlyOne from "src/utils/require-only-one";
import { buildStringSearchParameters, SearchStringInput } from "src/utils/search-string-input";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include" ;
import ParseBaseRelationIncludePipe from "src/relation-include/relation-include.pipe";
import BaseSortingParameter from 'src/sort/models/sorting-parameter';
import ParseBaseSortingParameterPipe from 'src/sort/sort.pipe';

namespace LibraryQueryParameters {

	/**
	 * Parameters required to create a Library
	 */
	export type CreateInput = OmitId<OmitSlug<Library>>;

	/**
	 * The Query parameters to get a library
	 */
	export type WhereInput = RequireOnlyOne<{
		id: number,
		slug: Slug
	}>;
	/**
	 * Build the query parameters for ORM, to select one library
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForOne(where: WhereInput): Prisma.LibraryWhereUniqueInput {
		return {
			id: where.id,
			slug: where.slug?.toString()
		};
	}

	/**
	 * The Query parameters to get multiple libraries
	 */
	export type ManyWhereInput = Partial<RequireOnlyOne<{
		byName: SearchStringInput
	}>>;
	/**
	 * Build the query parameters for ORM, to select multiple libraries
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForMany(where: ManyWhereInput): Prisma.LibraryWhereInput {
		return {
			name: where.byName ? buildStringSearchParameters(where.byName) : undefined
		};
	}

	/**
	 * The Query parameters to update a library
	 */
	export type UpdateInput = Partial<CreateInput>;

	/**
	 * The relation field to include in a returned library
	 */
	export const AvailableIncludes = ['files'] as const;
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;
	export const ParseRelationIncludePipe = new ParseBaseRelationIncludePipe(AvailableIncludes);

	/**
	 * Defines how to sort fetched entries
	 */
	export const AvailableFields = Object.values(Prisma.LibraryScalarFieldEnum);
	export class SortingParameter extends BaseSortingParameter<typeof AvailableFields>{};
	export const ParseSortingParameterPipe = new ParseBaseSortingParameterPipe(AvailableFields);

	/**
	 * Build the query parameters for ORM to include relations
	 * @returns the ORM-ready query parameters
	 */
	export function buildIncludeParameters(include?: RelationInclude) {
		return {
			files: include?.files ?? false
		};
	}
}

export default LibraryQueryParameters;