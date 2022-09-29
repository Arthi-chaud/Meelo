import { Prisma, Release } from "@prisma/client";
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import type Slug from "src/slug/slug"
import type OmitId from "src/utils/omit-id";
import type OmitReleaseDate from "src/utils/omit-release-date";
import type OmitSlug from "src/utils/omit-slug";
import type { RequireExactlyOne } from 'type-fest';
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include" ;
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import ParseBaseRelationIncludePipe from "src/relation-include/relation-include.pipe";
import BaseSortingParameter from 'src/sort/models/sorting-parameter';
import ParseBaseSortingParameterPipe from 'src/sort/sort.pipe';
import type { SearchStringInput } from "src/utils/search-string-input";

namespace ReleaseQueryParameters {

	type OmitAlbumId<T> = Omit<T, 'albumId'>;
	/**
	 * Parameters to create a release
	 */
	export type CreateInput = OmitReleaseDate<OmitAlbumId<OmitId<OmitSlug<Release>>>>
		& { releaseDate?: Date }
		& { album: AlbumQueryParameters.WhereInput };

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
	export const AvailableFields = Object.values(Prisma.ReleaseScalarFieldEnum);
	export class SortingParameter extends BaseSortingParameter<typeof AvailableFields>{};
	export const ParseSortingParameterPipe = new ParseBaseSortingParameterPipe(AvailableFields);
}

export default ReleaseQueryParameters;