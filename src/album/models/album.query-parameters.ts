import { Album, Prisma } from "@prisma/client";
import { Exclude } from "class-transformer";
import { ArtistQueryParameters } from "src/artist/models/artist.query-parameters";
import { LibraryQueryParameters } from "src/library/models/library.query-parameters";
import { Slug } from "src/slug/slug"
import { OmitId } from "src/utils/omit-id";
import { OmitReleaseDate } from "src/utils/omit-release-date";
import { OmitSlug } from "src/utils/omit-slug";
import { RequireAtLeastOne } from "src/utils/require-at-least-one";
import { RequireOnlyOne } from "src/utils/require-only-one"
import { SearchDateInput } from "src/utils/search-date-input";
import { buildStringSearchParameters, SearchStringInput } from "src/utils/search-string-input";

export namespace AlbumQueryParameters {

	type OmitType<T> = Omit<T, 'type'>;
	type OmitArtistId<T> = Omit<T, 'artistId'>;

	/**
	 * The input required to save an album in the database
	 */
	export type CreateInput = OmitReleaseDate<OmitId<OmitSlug<OmitArtistId<OmitType<Album>>>>>
		& { releaseDate?: Date }
		& { artist?: ArtistQueryParameters.WhereInput };
	
	/**
	 * The input required to update an album in the database
	 */
	export type UpdateInput = Partial<OmitId<OmitSlug<Album>>>;

	/**
	 * The input to find or create an album
	 */
	export type GetOrCreateInput = CreateInput;
	/**
	 * Query parameters to find one album
	 */
	export type WhereInput = RequireOnlyOne<{
		byId: { id: number },
		bySlug: { slug: Slug, artist?: ArtistQueryParameters.WhereInput }
	}>;

	/**
	 * Build the query parameters for ORM, to select one album
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForOne(where: WhereInput) {
		return {
			id: where.byId?.id ?? undefined,
			slug: where.bySlug?.slug.toString(),
			artistId: where.bySlug ?
				where.bySlug.artist ? where.bySlug.artist.id : null
			: undefined,
			artist: where.bySlug ?
				where.bySlug.artist ? {
					slug: where.bySlug?.artist.slug?.toString()
				} : null
			: undefined
		}
	}

	/**
	 * Query parameters to find multiple albums
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		byArtist: { artistSlug?: Slug },
		byName: SearchStringInput,
		byLibrarySource: LibraryQueryParameters.WhereInput,
		byReleaseDate: SearchDateInput
	}>>;

	/**
	 * Build the query parameters for ORM, to select multiple rows
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForMany(where: ManyWhereInput): Prisma.AlbumWhereInput {
		return {
			artist: where.byArtist ?
				where.byArtist.artistSlug ? {
					slug: where.byArtist?.artistSlug.toString()
				} : null
				: undefined,
			name: buildStringSearchParameters(where.byName),
			releases: where.byLibrarySource ? {
				some: {
					tracks: {
						some: {
							sourceFile: {
								library: LibraryQueryParameters.buildQueryParametersForOne(where.byLibrarySource)
							}
						}
					}
				}
			} : undefined
		};
	}

	/**
	 * Defines what relations to include in query
	 */
	export type RelationInclude = Partial<{
		releases: boolean,
		artist: boolean
	}>;

	/**
	 * Build the query parameters for ORM to include relations
	 * @returns the ORM-ready query parameters
	 */
	export function buildIncludeParameters(include?: RelationInclude) {
		return {
			releases: include?.releases ?? false,
			artist: include?.artist ?? false
		};
	}
}