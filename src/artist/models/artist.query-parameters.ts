import type { Artist, Prisma } from "@prisma/client";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import LibraryQueryParameters from "src/library/models/library.query-parameters";
import type Slug from "src/slug/slug";
import SongQueryParameters from "src/song/models/song.query-params";
import { type IncludeParameter, buildIncludeParameter } from "src/utils/include-parameter";
import type OmitId from "src/utils/omit-id";
import type OmitSlug from "src/utils/omit-slug";
import type RequireAtLeastOne from "src/utils/require-at-least-one";
import type RequireOnlyOne from "src/utils/require-only-one"
import type { SearchStringInput } from "src/utils/search-string-input";

namespace ArtistQueryParameters {

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
	/**
	 * Build the query parameters for ORM, to select one artist
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForOne(where: WhereInput) {
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
	 * Build the query parameters for ORM, to select multiple artists
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForMany(where: ManyWhereInput): Prisma.ArtistWhereInput {
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
										library: LibraryQueryParameters.buildQueryParametersForOne(where.byLibrarySource)
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
		albums: IncludeParameter<AlbumQueryParameters.RelationInclude>,
		songs: IncludeParameter<SongQueryParameters.RelationInclude>,
	}>;

	/**
	 * Build the query parameters for ORM to include relations
	 * @returns the ORM-ready query parameters
	 */
	export function buildIncludeParameters(include?: RelationInclude): any {
		return {
			albums: buildIncludeParameter(
				AlbumQueryParameters.buildIncludeParameters,
				include?.albums
			),
			songs: buildIncludeParameter(
				SongQueryParameters.buildIncludeParameters,
				include?.songs
			),
		};
	}
}

export default ArtistQueryParameters;