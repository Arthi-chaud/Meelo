import { Slug } from "src/slug/slug";
import { RequireOnlyOne } from "src/utils/require-only-one";

export namespace LibraryQueryParameters {
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
}