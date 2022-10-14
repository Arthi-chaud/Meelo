import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import type Slug from "src/slug/slug";
import type { RequireExactlyOne } from 'type-fest';
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include" ;
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import ParseBaseRelationIncludePipe from "src/relation-include/relation-include.pipe";
import BaseSortingParameter from 'src/sort/models/sorting-parameter';
import ParseBaseSortingParameterPipe from 'src/sort/sort.pipe';
import type { SearchStringInput } from "src/utils/search-string-input";
import { Release } from "src/prisma/models";
import { ApiPropertyOptional } from "@nestjs/swagger";

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
		byId: { id: number },
		bySlug: { slug: Slug, album: AlbumQueryParameters.WhereInput },
		byMasterOf: AlbumQueryParameters.WhereInput,
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
		releaseId: number, 
		album: AlbumQueryParameters.WhereInput,
	};

	/**
	 * Parameters to find or create an Release
	 */
	export type GetOrCreateInput = CreateInput;

	/**
	 * Query parameters to delete one release
	 */
	 export type DeleteInput = Required<Pick<WhereInput, 'byId'>>;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ['album', 'tracks'] as const;
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;
	export const ParseRelationIncludePipe = new ParseBaseRelationIncludePipe(AvailableIncludes);
	
	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = ['id', 'name', 'releaseDate', 'trackCount', 'addDate'] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends BaseSortingParameter<SortingKeys>{
		@ApiPropertyOptional({ enum: SortingKeys })
		sortBy: SortingKeys[number]
	}
	export const ParseSortingParameterPipe = new ParseBaseSortingParameterPipe(SortingKeys);
}

export default ReleaseQueryParameters;