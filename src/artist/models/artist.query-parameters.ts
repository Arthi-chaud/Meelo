import { Artist } from "@prisma/client";
import { LibraryQueryParameters } from "src/library/models/library.query-parameters";
import { Slug } from "src/slug/slug"
import { OmitId } from "src/utils/omit-id";
import { OmitSlug } from "src/utils/omit-slug";
import { RequireAtLeastOne } from "src/utils/require-at-least-one";
import { RequireOnlyOne } from "src/utils/require-only-one"
import { SearchStringInput } from "src/utils/search-string-input";

export namespace ArtistQueryParameters {

	/**
	 * Parameters to create an Artist
	 */
	export type CreateInput = OmitSlug<OmitId<Artist>>;
	/**
	 * Query parameters to find one artist
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
	 * Query parameters to find multiple artists
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		byLibrarySource: LibraryQueryParameters.WhereInput,
		byName: SearchStringInput,
	}>>;

	/**
	 * Build the query parameters for ORM, to select multiple rows
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForMany(where: ManyWhereInput) {
		return {
			slug: {
				startsWith: where.byName?.startsWith,
				contains: where.byName?.contains,
			},
			albums: where.byLibrarySource ? {
				some: {
					releases: {
						some: {
							tracks: {
								some: {
									sourceFile: {
										library: LibraryQueryParameters.buildQueryParameters(where.byLibrarySource)
									}
								}
							}
						}
					}
				}
			} : undefined
		};
	}

	/**
	 * Parameters to update an Artist
	 */
	 export type UpdateInput = Partial<CreateInput>;
	
	/**
	 * Parameters to find or create an Artist
	 */
	export type GetOrCreateInput = CreateInput;
	
	/**
	 * Defines what relations to include in query
	 */
	export type RelationInclude = Partial<{
		albums: boolean,
		songs: boolean
	}>;

	export function buildIncludeParameters(include?: RelationInclude) {
		return {
			albums: include?.albums ?? false,
			songs: include?.songs ?? false
		};
	}
}