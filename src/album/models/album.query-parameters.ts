import { Prisma } from "@prisma/client";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import type Slug from "src/slug/slug";
import type { RequireAtLeastOne } from "type-fest";
import type { RequireExactlyOne } from 'type-fest';
import type { SearchDateInput } from "src/utils/search-date-input";
import type { SearchStringInput } from "src/utils/search-string-input";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include" ;
import ParseBaseRelationIncludePipe from 'src/relation-include/relation-include.pipe';
import BaseSortingParameter from 'src/sort/models/sorting-parameter';
import ParseBaseSortingParameterPipe from 'src/sort/sort.pipe';
import type GenreQueryParameters from "src/genre/models/genre.query-parameters";
import { Album } from "src/prisma/models";
import { IntersectionType, PartialType, PickType } from "@nestjs/swagger";

namespace AlbumQueryParameters {

	/**
	 * The input required to save an album in the database
	 */
	export class CreateInput extends IntersectionType(
		PickType(Album, ['name'] as const),
		class {
			releaseDate?: Date;
			artist?: ArtistQueryParameters.WhereInput
		}
	) {};

	/**
	 * Query parameters to find one album
	 */
	export type WhereInput = RequireExactlyOne<{
		byId: { id: number },
		bySlug: { slug: Slug, artist?: ArtistQueryParameters.WhereInput }
	}>;

	/**
	 * Query parameters to find multiple albums
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		byArtist: ArtistQueryParameters.WhereInput,
		byName: SearchStringInput,
		byLibrarySource: LibraryQueryParameters.WhereInput,
		byReleaseDate: SearchDateInput,
		byGenre: GenreQueryParameters.WhereInput
	}>>;

	/**
 	 * The input required to update an album in the database
 	 */
	export class UpdateInput extends  PartialType(PickType(Album, ['name', 'type', 'releaseDate', 'artistId'] as const)) {};

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
	 * Defines how to sort fetched entries
	 */
	export const AvailableFields = Object.values(Prisma.AlbumScalarFieldEnum);
	export class SortingParameter extends BaseSortingParameter<typeof AvailableFields>{};
	export const ParseSortingParameterPipe = new ParseBaseSortingParameterPipe(AvailableFields);
}

export default AlbumQueryParameters;