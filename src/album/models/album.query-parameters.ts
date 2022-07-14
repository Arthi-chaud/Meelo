import type { Album, Prisma } from "@prisma/client";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import type Slug from "src/slug/slug"
import type OmitId from "src/utils/omit-id";
import type OmitReleaseDate from "src/utils/omit-release-date";
import type OmitSlug from "src/utils/omit-slug";
import type RequireAtLeastOne from "src/utils/require-at-least-one";
import type RequireOnlyOne from "src/utils/require-only-one"
import type { SearchDateInput } from "src/utils/search-date-input";
import { buildStringSearchParameters, SearchStringInput } from "src/utils/search-string-input";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include" ;
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ParseBaseRelationIncludePipe from 'src/relation-include/relation-include.pipe';

namespace AlbumQueryParameters {

	type OmitType<T> = Omit<T, 'type'>;
	type OmitArtistId<T> = Omit<T, 'artistId'>;

	/**
	 * The input required to save an album in the database
	 */
	export type CreateInput = OmitReleaseDate<OmitId<OmitSlug<OmitArtistId<OmitType<Album>>>>>
		& { releaseDate?: Date }
		& { artist?: ArtistQueryParameters.WhereInput };

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
			id: where.byId?.id,
			slug: where.bySlug?.slug.toString(),
			artist: where.bySlug ?
				where.bySlug.artist
					? ArtistQueryParameters.buildQueryParametersForOne(where.bySlug.artist)
					: null
			: undefined
		}
	}

	/**
	 * Query parameters to find multiple albums
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		byArtist: ArtistQueryParameters.WhereInput | null,
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
					ArtistQueryParameters.buildQueryParametersForOne(where.byArtist)	
			: where.byArtist,
			name: buildStringSearchParameters(where.byName),
			releases: where.byLibrarySource ? {
				some: ReleaseQueryParameters.buildQueryParametersForMany({ library: where.byLibrarySource })
			} : undefined
		};
	}

	/**
 	 * The input required to update an album in the database
 	 */
	export type UpdateInput = Partial<OmitId<OmitSlug<Album>>>;

	/**
	 * The input to find or create an album
	 */
	export type GetOrCreateInput = CreateInput;

	/**
	 * Query parameters to delete one album
	 */
	 export type DeleteInput = Required<Pick<WhereInput, 'byId'>>;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ['releases', 'artist'] as const;
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;
	export const ParseRelationIncludePipe = new ParseBaseRelationIncludePipe(AvailableIncludes);

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

export default AlbumQueryParameters;