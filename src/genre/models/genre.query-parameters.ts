import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import type Slug from "src/slug/slug";
import type SongQueryParameters from "src/song/models/song.query-params";
import type { RequireAtLeastOne } from "type-fest";
import type { RequireExactlyOne } from 'type-fest';
import type { SearchStringInput } from "src/utils/search-string-input";
import ParseBaseRelationIncludePipe from 'src/relation-include/relation-include.pipe';
import BaseSortingParameter from 'src/sort/models/sorting-parameter';
import ParseBaseSortingParameterPipe from 'src/sort/sort.pipe';
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include" ;
import { Genre } from "src/prisma/models";
namespace GenreQueryParameters {
	/**
	 * The input required to save a genre in the database
	 */
	export type CreateInput = Omit<Genre, 'id' | 'slug' | 'songs'>;

	/**
	 * Query parameters to find one genre
	 */
	export type WhereInput = RequireExactlyOne<{
		id: number,
		slug: Slug
	}>;

	/**
	 * Query parameters to find multiple genre
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		bySong: SongQueryParameters.WhereInput,
		byArtist: ArtistQueryParameters.WhereInput,
		byName: SearchStringInput,
	}>>;

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
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = ['id', 'name', 'songCount'] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends BaseSortingParameter<SortingKeys>{}
	export const ParseSortingParameterPipe = new ParseBaseSortingParameterPipe(SortingKeys);


}

export default GenreQueryParameters;