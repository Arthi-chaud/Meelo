import { File, Prisma } from "@prisma/client";
import { LibraryQueryParameters } from "src/library/models/library.query-parameters";
import { OmitId } from "src/utils/omit-id";
import { RequireAtLeastOne } from "src/utils/require-at-least-one";
import { RequireOnlyOne } from "src/utils/require-only-one";
import { buildDateSearchParameters, SearchDateInput } from "src/utils/search-date-input";

export namespace FileQueryParameters {
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
		path: string
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
			path: where.path,
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
	export type UpdateInput = CreateInput;
	
	/**
	 * Relations to include in returned File object
	 */
	export type RelationInclude = Partial<{
		track: boolean,
		library: boolean
	}>;
	/**
	 * Build the query parameters for ORM to include relations
	 * @returns the ORM-ready query parameters
	 */
	export function buildIncludeParameters(include?: RelationInclude) {
		return {
			track: include?.track,
			library: include?.library,
		};
	}
}