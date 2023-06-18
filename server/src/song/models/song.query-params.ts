import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import type Slug from "src/slug/slug";
import type { RequireAtLeastOne, RequireExactlyOne } from "type-fest";
import type { SearchStringInput } from "src/utils/search-string-input";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import { ModelSortingParameter } from 'src/sort/models/sorting-parameter';
import type GenreQueryParameters from "src/genre/models/genre.query-parameters";
import { Artist, Song } from "src/prisma/models";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";
import AlbumQueryParameters from "src/album/models/album.query-parameters";

namespace SongQueryParameters {
	/**
	 * The input required to save a song in the database
	 */
	export type CreateInput = Omit<Song, 'slug' | 'id' | 'playCount' | 'artist' | 'artistId' | 'tracks' | 'genres' | 'lyrics' | 'masterId' | 'registeredAt'>
		& {
			artist: ArtistQueryParameters.WhereInput,
			registeredAt?: Date,
			genres: GenreQueryParameters.WhereInput[]
		};

	/**
	 * Query paraeters to find a song
	 */
	export type WhereInput = RequireExactlyOne<{
		id: Song['id'],
		bySlug: { slug: Slug, artist: ArtistQueryParameters.WhereInput }
	}>;

	/**
	 * Query paraeters to find a song to update
	 */
	export type UpdateWhereInput = RequireExactlyOne<{
		id: Song['id'],
		bySlug: { slug: Slug, artistId: Artist['id'] }
	}>;

	/**
	 * Query params to find multiple songs
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		name: SearchStringInput,
		album: AlbumQueryParameters.WhereInput,
		artist?: ArtistQueryParameters.WhereInput,
		library: LibraryQueryParameters.WhereInput,
		genre: GenreQueryParameters.WhereInput,
		playCount: RequireExactlyOne<Record<'below' | 'exact' | 'moreThan', number>>,
	}>>;

	/**
	 * The input required to update a song in the database
	 */
	export type UpdateInput = Partial<CreateInput & Pick<Song, 'playCount'>>;
	export type DeleteInput = {
		id: Song['id']
	};
	/**
	 * The input to find or create a song
	 */
	export type GetOrCreateInput = CreateInput;
	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = [
		'tracks',
		'artist',
		'genres',
		'lyrics',
		'externalIds'
	] as const;
	export const AvailableAtomicIncludes = filterAtomicRelationInclude(AvailableIncludes, ['lyrics', 'externalIds']);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = [
		'id',
		'name',
		'playCount',
		'artistName',
		'addDate'
	] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}

}

export default SongQueryParameters;
