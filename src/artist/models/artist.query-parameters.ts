import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import type Slug from "src/slug/slug"
import type { RequireAtLeastOne } from "type-fest";
import type { RequireExactlyOne } from 'type-fest';
import type { SearchStringInput } from "src/utils/search-string-input";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include" ;
import ParseBaseRelationIncludePipe from "src/relation-include/relation-include.pipe";
import BaseSortingParameter from 'src/sort/models/sorting-parameter';
import ParseBaseSortingParameterPipe from 'src/sort/sort.pipe';
import type GenreQueryParameters from "src/genre/models/genre.query-parameters";
import { Artist } from "src/prisma/models";
import { ApiPropertyOptional } from "@nestjs/swagger";

namespace ArtistQueryParameters {

	/**
	 * Parameters to create an Artist
	 */
	export type CreateInput = Omit<Artist, 'id' | 'slug' | 'songs' | 'albums'>;
	/**
	 * Query parameters to find one artist
	 */
	export type WhereInput = RequireExactlyOne<{
		id: number,
		slug: Slug,
		compilationArtist: true
	}>;
	
	/**
	 * Query parameters to find multiple artists
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		byLibrarySource: LibraryQueryParameters.WhereInput,
		byName: SearchStringInput,
		byIds: { in: number[] },
		byGenre: GenreQueryParameters.WhereInput
		
	}>>;

	/**
	 * Parameters to update an Artist
	 */
	export type UpdateInput = Partial<CreateInput>;

	/**
	 * Parameters to delete an Artist
	 */
	export type DeleteInput = RequireExactlyOne<Omit<WhereInput, 'compilationArtist'>>;
	
	/**
	 * Parameters to find or create an Artist
	 */
	export type GetOrCreateInput = CreateInput;
	
	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ['albums', 'songs'] as const;
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;
	export const ParseRelationIncludePipe = new ParseBaseRelationIncludePipe(AvailableIncludes);

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = ['id', 'name', 'albumCount', 'songCount', 'addDate'] as const;
	export type SortingKeys = typeof SortingKeys
	export class SortingParameter extends BaseSortingParameter<SortingKeys>{
		@ApiPropertyOptional({ enum: SortingKeys })
		sortBy: SortingKeys[number]
	}
	export const ParseSortingParameterPipe = new ParseBaseSortingParameterPipe(SortingKeys);
}

export default ArtistQueryParameters;