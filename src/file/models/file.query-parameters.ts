import type { File } from "@prisma/client";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import type OmitId from "src/utils/omit-id";
import type { RequireAtLeastOne } from "type-fest";
import type { RequireExactlyOne } from 'type-fest';;
import type { SearchDateInput } from "src/utils/search-date-input";
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
	export type WhereInput = RequireExactlyOne<{
		trackId: number,
		id: number,
		byPath: { path: string, library: LibraryQueryParameters.WhereInput }
	}>;
	
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
}

export default FileQueryParameters;