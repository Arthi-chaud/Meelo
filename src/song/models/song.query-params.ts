import { Prisma, Song } from "@prisma/client";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import type Slug from "src/slug/slug"
import type OmitId from "src/utils/omit-id";
import type OmitSlug from "src/utils/omit-slug";
import type { RequireAtLeastOne } from "type-fest";
import type { RequireExactlyOne } from 'type-fest';
import type { SearchStringInput } from "src/utils/search-string-input";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import ParseBaseRelationIncludePipe from 'src/relation-include/relation-include.pipe';
import BaseSortingParameter from 'src/sort/models/sorting-parameter';
import ParseBaseSortingParameterPipe from 'src/sort/sort.pipe';
import type GenreQueryParameters from "src/genre/models/genre.query-parameters";

namespace SongQueryParameters {
	type OmitArtistId<T> = Omit<T, 'artistId'>;
	type OmitPlayCount<T> = Omit<T, 'playCount'>;
	/**
	 * The input required to save a song in the database
	 */
	export type CreateInput = OmitSlug<OmitPlayCount<OmitId<OmitArtistId<Song>>>>
		& {
			artist: ArtistQueryParameters.WhereInput,
			genres: GenreQueryParameters.WhereInput[]
		};
	
	/**
	 * Query paraeters to find a song
	 */
	export type WhereInput = RequireExactlyOne<{
		byId: { id: number },
		bySlug: { slug: Slug, artist: ArtistQueryParameters.WhereInput }
	}>;

	/**
	 * Query paraeters to find a song to update
	 */
	 export type UpdateWhereInput = RequireExactlyOne<{
		byId: { id: number },
		bySlug: { slug: Slug, artistId: number }
	}>;

	/**
	 * Query params to find multiple songs
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		name: SearchStringInput,
		artist?: ArtistQueryParameters.WhereInput,
		library: LibraryQueryParameters.WhereInput,
		genre: GenreQueryParameters.WhereInput,
		playCount: RequireExactlyOne<{ below: number, exact: number, moreThan: number }>,
	}>>;

	/**
	 * The input required to update a song in the database
	 */
	export type UpdateInput = Partial<OmitId<OmitArtistId<Song>>>
		& Partial<{
			artist: ArtistQueryParameters.WhereInput,
			genres: GenreQueryParameters.WhereInput[]
		}>;
	export type DeleteInput = {
		id: number
	};
	/**
	 * The input to find or create a song
	 */
	export type GetOrCreateInput = CreateInput;
	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ['tracks', 'artist', 'genres', 'lyrics'] as const;
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;
	export const ParseRelationIncludePipe = new ParseBaseRelationIncludePipe(AvailableIncludes);

	/**
	 * Defines how to sort fetched entries
	 */
	export const AvailableFields = Object.values(Prisma.SongScalarFieldEnum);
	export class SortingParameter extends BaseSortingParameter<typeof AvailableFields>{};
	export const ParseSortingParameterPipe = new ParseBaseSortingParameterPipe(AvailableFields);

}

export default SongQueryParameters;