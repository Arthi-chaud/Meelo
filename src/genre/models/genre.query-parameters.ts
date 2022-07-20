import { Genre, Prisma } from "@prisma/client";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import type Slug from "src/slug/slug";
import SongQueryParameters from "src/song/models/song.query-params";
import type OmitId from "src/utils/omit-id";
import type OmitSlug from "src/utils/omit-slug";
import type RequireAtLeastOne from "src/utils/require-at-least-one";
import type RequireOnlyOne from "src/utils/require-only-one";
import { buildStringSearchParameters, SearchStringInput } from "src/utils/search-string-input";
import ParseBaseRelationIncludePipe from 'src/relation-include/relation-include.pipe';
import BaseSortingParameter from 'src/sort/models/sorting-parameter';
import ParseBaseSortingParameterPipe from 'src/sort/sort.pipe';
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include" ;
namespace GenreQueryParameters {
	/**
	 * The input required to save a genre in the database
	 */
	export type CreateInput = OmitSlug<OmitId<Genre>>;

	/**
	 * Query parameters to find one genre
	 */
	export type WhereInput = RequireOnlyOne<{
		id: number,
		slug: Slug
	}>;
	/**
	 * Build the query parameters for ORM, to select one genre
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
 	export function buildQueryParametersForOne(where: WhereInput) {
		return {
			id: where.id,
			slug: where.slug?.toString()
		}
	}

	/**
	 * Query parameters to find multiple genre
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		bySong: SongQueryParameters.WhereInput,
		byArtist: ArtistQueryParameters.WhereInput,
		byName: SearchStringInput,
	}>>;

	/**
	 * Build the query parameters for ORM, to select multiple genres
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
 	export function buildQueryParametersForMany(where: ManyWhereInput) {
		return {
			name: where.byName
				? buildStringSearchParameters(where.byName)
				: undefined,
			songs: where.bySong || where.byArtist ? {
				some: where.bySong
					? SongQueryParameters.buildQueryParametersForOne(where.bySong)
					: where.byArtist
						? { artist: ArtistQueryParameters.buildQueryParametersForOne(where.byArtist) }
						: undefined
			} : undefined,
			
		}
	}

	/**
 	 * The input required to update a genre in the database
 	 */
	export type UpdateInput = CreateInput;

	/**
	 * The input to find or create an genre
	 */
	export type GetOrCreateInput = CreateInput;

	/**
	 * Query parameters to delete one genre
	 */
	export type DeleteInput = WhereInput;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ['songs'] as const;
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;
	export const ParseRelationIncludePipe = new ParseBaseRelationIncludePipe(AvailableIncludes);

	/**
	 * Build the query parameters for ORM to include relations
	 * @returns the ORM-ready query parameters
	 */
	export function buildIncludeParameters(include?: RelationInclude) {
		return {
			songs: include?.songs ?? false
		};
	}
	/**
	 * Defines how to sort fetched entries
	 */
	export const AvailableFields = Object.values(Prisma.GenreScalarFieldEnum);
	export class SortingParameter extends BaseSortingParameter<typeof AvailableFields>{};
	export const ParseSortingParameterPipe = new ParseBaseSortingParameterPipe(AvailableFields);


}

export default GenreQueryParameters;