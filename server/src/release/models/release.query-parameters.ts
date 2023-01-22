import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import type Slug from "src/slug/slug";
import type { RequireExactlyOne } from 'type-fest';
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import { ModelSortingParameter } from 'src/sort/models/sorting-parameter';
import type { SearchStringInput } from "src/utils/search-string-input";
import { Release } from "src/prisma/models";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";

namespace ReleaseQueryParameters {
	/**
	 * Parameters to create a release
	 */
	export type CreateInput = Omit<Release, 'releaseDate' | 'album' | 'albumId' | 'id' | 'slug' | 'tracks'>
		& {
			releaseDate?: Date;
			album: AlbumQueryParameters.WhereInput
		};

	/**
	 * Query parameters to find one release
	 */
	export type WhereInput = RequireExactlyOne<{
		id: Release['id'],
		bySlug: { slug: Slug, album: AlbumQueryParameters.WhereInput },
	}>;

	/**
	 * Query parameters to find multiple Releases
	 */
	export type ManyWhereInput = Partial<{
		name: SearchStringInput,
		album: AlbumQueryParameters.WhereInput,
		library: LibraryQueryParameters.WhereInput
	}>;

	/**
	 * Parameters to update a Release
	 */
	export type UpdateInput = Partial<CreateInput>;

	/**
	 * Parameters to update the master release of an album
	 */
	export type UpdateAlbumMaster = {
		releaseId: Release['id'],
		album: AlbumQueryParameters.WhereInput,
	};

	/**
	 * Parameters to find or create an Release
	 */
	export type GetOrCreateInput = CreateInput;

	/**
	 * Query parameters to delete one release
	 */
	export type DeleteInput = Required<Pick<WhereInput, 'id'>>;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ['album', 'tracks'] as const;
	export const AvailableAtomicIncludes = filterAtomicRelationInclude(AvailableIncludes);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = [
		'id',
		'name',
		'releaseDate',
		'trackCount',
		'addDate'
	] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}

}

export default ReleaseQueryParameters;
