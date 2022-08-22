import type { File, Prisma } from "@prisma/client";
import LibraryQueryParameters from "src/library/models/library.query-parameters";
import type OmitId from "src/utils/omit-id";
import type RequireAtLeastOne from "src/utils/require-at-least-one";
import type RequireOnlyOne from "src/utils/require-only-one";
import { buildDateSearchParameters, SearchDateInput } from "src/utils/search-date-input";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include" ;
import ParseBaseRelationIncludePipe from "src/relation-include/relation-include.pipe";
namespace FileQueryParameters {
	/**
	 * Parameters to create a File
	 */
	 export type CreateInput = OmitId<File>;
	/**
	 * Query parameters to find one file
	 */
	export type WhereInput = RequireOnlyOne<{
		trackId: number,
		id: number,
		byPath: { path: string, library: LibraryQueryParameters.WhereInput }
	}>;

	/**
	 * Build the query parameters for ORM, to select one file
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForOne(where: WhereInput) {
		return {
			id: where.id,
			track: where.trackId ? {
				id: where.trackId
			} : undefined,
			path: where.byPath?.path,
			library: where.byPath
				? LibraryQueryParameters.buildQueryParametersForOne(where.byPath.library)
				: undefined
		};
	}
	
	/**
	 * Query parameters to find multiple files
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		library: LibraryQueryParameters.WhereInput,
		ids: number[],
		paths: string[],
		byRegistrationDate: SearchDateInput
	}>>;

	/**
	 * Build the query parameters for ORM, to select multiple files
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForMany(where: ManyWhereInput): Prisma.FileWhereInput {
		return {
			id: where.ids !== undefined ? {
				in: where.ids
			} : undefined,
			library: where.library
				? LibraryQueryParameters.buildQueryParametersForOne(where.library)
				: undefined,
			path: where.paths !== undefined ? {
				in: where.paths
			} : undefined,
			registerDate: where.byRegistrationDate
				? buildDateSearchParameters(where.byRegistrationDate)
				: undefined
		}
	}

	/**
	 * The parameters needed to update a File
	 */
	export type UpdateInput = Partial<CreateInput>;

	/**
	 * Query parameters to delete one file
	 */
	 export type DeleteInput = Required<Pick<WhereInput, 'id'>>;
	
	/**
	 * Relations to include in returned File object
	 */
	export const AvailableIncludes = ['track', 'library'] as const;
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;
	 export const ParseRelationIncludePipe = new ParseBaseRelationIncludePipe(AvailableIncludes);
	/**
	 * Build the query parameters for ORM to include relations
	 * @returns the ORM-ready query parameters
	 */
	export function buildIncludeParameters(include?: RelationInclude) {
		return {
			track: include?.track ?? false,
			library: include?.library ?? false,
		};
	}
}

export default FileQueryParameters;