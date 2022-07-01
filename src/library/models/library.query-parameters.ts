import type { Library, Prisma } from "@prisma/client";
import FileQueryParameters from "src/file/models/file.query-parameters";
import type Slug from "src/slug/slug";
import { buildIncludeParameter, IncludeParameter } from "src/utils/include-parameter";
import type OmitId from "src/utils/omit-id";
import type OmitSlug from "src/utils/omit-slug";
import type RequireOnlyOne from "src/utils/require-only-one";
import { buildStringSearchParameters, SearchStringInput } from "src/utils/search-string-input";

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
	export type RelationInclude = {
		files: IncludeParameter<FileQueryParameters.RelationInclude>
	};
	/**
	 * Build the query parameters for ORM to include relations
	 * @returns the ORM-ready query parameters
	 */
	export function buildIncludeParameters(include?: RelationInclude): any {
		return {
			files: buildIncludeParameter(
				FileQueryParameters.buildIncludeParameters,
				include?.files
			)
		};
	}
}

export default LibraryQueryParameters;