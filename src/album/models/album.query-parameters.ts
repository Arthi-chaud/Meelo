import { Album } from "@prisma/client";
import { Exclude } from "class-transformer";
import { ArtistWhereInput } from "src/artist/models/artist.query-parameters";
import { Slug } from "src/slug/slug"
import { OmitId } from "src/utils/omit-id";
import { OmitSlug } from "src/utils/omit-slug";
import { RequireAtLeastOne } from "src/utils/require-at-least-one";
import { RequireOnlyOne } from "src/utils/require-only-one"

export namespace AlbumQueryParameters {

	type OmitType<T> = Omit<T, 'type'>;
	type OmitArtistId<T> = Omit<T, 'artistId'>;

	/**
	 * The input required to save an album in the database
	 */
	export type CreateInput = Omit<OmitId<OmitSlug<OmitArtistId<OmitType<Album>>>>, 'releaseDate'>
		& { releaseDate?: Date }
		& { artist?: ArtistWhereInput };
	
	/**
	 * The input required to update an album in the database
	 */
	export type UpdateInput = Partial<OmitId<OmitSlug<Album>>>;

	/**
	 * The input to find or create an album
	 */
	export type FindOrCreateInput = CreateInput;
	/**
	 * Query parameters to find one album
	 */
	export type WhereInput = RequireOnlyOne<{
		byId: { id: number },
		bySlug: { slug: Slug, artist?: ArtistWhereInput }
	}>;

	/**
	 * Build the query parameters for ORM, to select one album
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParameterForOne(where: WhereInput) {
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
	export type ManyWhereInput = RequireAtLeastOne<{
		byArtist: { artistSlug?: Slug },
		byName: { startsWith: string, contains: string }
		byLibrarySource: { libraryId: number },
	}>;

	/**
	 * Build the query parameters for ORM, to select multiple rows
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForMany(where: ManyWhereInput) {
		return {
			artist: where.byArtist ?
				where.byArtist.artistSlug ? {
					slug: where.byArtist?.artistSlug.toString()
				} : null
				: undefined,
			slug: {
				startsWith: where.byName?.startsWith?.toString(),
				contains: where.byName?.contains?.toString()
			},
			releases: where.byLibrarySource ? {
				some: {
					tracks: {
						some: {
							sourceFile: {
								libraryId: where.byLibrarySource.libraryId
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

	export function buildIncludeParameters(include?: RelationInclude) {
		return {
			releases: include?.releases ?? false,
			artist: include?.artist ?? false
		};
	}
}