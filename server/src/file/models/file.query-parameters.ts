import type { File, Track } from "src/prisma/models";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import type { RequireAtLeastOne, RequireExactlyOne } from "type-fest";
import type { SearchDateInput } from "src/utils/search-date-input";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";

namespace FileQueryParameters {
	/**
	 * Parameters to create a File
	 */
	export type CreateInput = Omit<File, 'library' | 'id' | 'track'>;
	/**
	 * Query parameters to find one file
	 */
	export type WhereInput = RequireExactlyOne<{
		trackId: Track['id'],
		id: File['id'],
		byPath: { path: File['path'], library: LibraryQueryParameters.WhereInput }
	}>;

	/**
	 * Query parameters to find multiple files
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		library: LibraryQueryParameters.WhereInput,
		id: { in: File['id'][] },
		paths: File['path'][],
		registrationDate: SearchDateInput
	}>>;

	/**
	 * The parameters needed to update a File
	 */
	export type UpdateInput = Partial<CreateInput>;

	/**
	 * Query parameters to delete one file
	 */
	export type DeleteInput = Required<Pick<WhereInput, 'id'>>;

	export const SortingKeys = [
		'id',
		'trackName',
		'trackArtist',
		'addDate'
	] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}

	/**
	 * Relations to include in returned File object
	 */
	export const AvailableIncludes = ['track', 'library'] as const;
	export const AvailableAtomicIncludes = filterAtomicRelationInclude(AvailableIncludes);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

}

export default FileQueryParameters;
