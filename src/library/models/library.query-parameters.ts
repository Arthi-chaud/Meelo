import { Library } from "@prisma/client";
import { Slug } from "src/slug/slug";
import { OmitId } from "src/utils/omit-id";
import { OmitSlug } from "src/utils/omit-slug";
import { RequireOnlyOne } from "src/utils/require-only-one";
import { buildDateSearchParameters } from "src/utils/search-date-input";
import { buildStringSearchParameters, SearchStringInput } from "src/utils/search-string-input";

export namespace LibraryQueryParameters {

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

	export function buildQueryParameters(where: WhereInput) {
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

	export function buildQueryParametersForMany(where: ManyWhereInput) {
		return {
			name: buildStringSearchParameters(where.byName)
		};
	}

	/**
	 * The Query parameters to update a library
	 */
	export type UpdateInput = CreateInput;

	/**
	 * The relation field to include in a returned library
	 */
	export type RelationInclude = {
		files: boolean
	};

	export function buildIncludeParameters(include?: RelationInclude) {
		return {
			files: include?.files ?? false
		};
	}
}