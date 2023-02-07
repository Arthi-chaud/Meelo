import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import type Slug from "src/slug/slug";
import type { RequireAtLeastOne, RequireExactlyOne } from "type-fest";
import type { SearchStringInput } from "src/utils/search-string-input";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import type GenreQueryParameters from "src/genre/models/genre.query-parameters";
import { Artist } from "src/prisma/models";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";

namespace ArtistQueryParameters {

	/**
	 * Parameters to create an Artist
	 */
	export type CreateInput = Omit<Artist, 'id' | 'slug' | 'songs' | 'albums' | 'registeredAt'> & {
		registeredAt?: Date
	};
	/**
	 * Query parameters to find one artist
	 */
	export type WhereInput = RequireExactlyOne<{
		id: Artist['id'],
		slug: Slug,
		compilationArtist: true
	}>;

	/**
	 * Query parameters to find multiple artists
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		library: LibraryQueryParameters.WhereInput,
		name: SearchStringInput,
		ids: { in: Artist['id'][] },
		genre: GenreQueryParameters.WhereInput

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
	export const AvailableAtomicIncludes = filterAtomicRelationInclude(AvailableIncludes);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = [
		'id',
		'name',
		'albumCount',
		'songCount',
		'addDate'
	] as const;
	export type SortingKeys = typeof SortingKeys
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}

}

export default ArtistQueryParameters;
