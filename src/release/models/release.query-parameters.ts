import type { Prisma, Release } from "@prisma/client";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import type Slug from "src/slug/slug"
import type OmitId from "src/utils/omit-id";
import type OmitReleaseDate from "src/utils/omit-release-date";
import type OmitSlug from "src/utils/omit-slug";
import type RequireOnlyOne from "src/utils/require-only-one"
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include" ;
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import TrackQueryParameters from "src/track/models/track.query-parameters";
import ParseBaseRelationIncludePipe from "src/relation-include/relation-include.pipe";

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
	export type WhereInput = RequireOnlyOne<{
		byId: { id: number },
		bySlug: { slug: Slug, album: AlbumQueryParameters.WhereInput },
		byMasterOf: AlbumQueryParameters.WhereInput,
	}>;

	/**
	 * Build the query parameters for ORM, to select one release
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForOne(where: WhereInput) {
		return {
			id: where.byId?.id,
			master: where.byMasterOf ? true : undefined,
			slug: where.bySlug?.slug.toString(),
			album: where.byMasterOf
				? AlbumQueryParameters.buildQueryParametersForOne(where.byMasterOf)
			: where.bySlug
				? AlbumQueryParameters.buildQueryParametersForOne(where.bySlug.album)
			: undefined
		};
	}

	/**
	 * Query parameters to find multiple Releases
	 */
	export type ManyWhereInput = Partial<{
		album: AlbumQueryParameters.WhereInput,
		library: LibraryQueryParameters.WhereInput
	}>;

	/**
	 * Build the query parameters for ORM, to select multiple releases
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForMany(where: ManyWhereInput): Prisma.ReleaseWhereInput {
		return {
			album: where.album ? {
				id: where.album.byId?.id,
				slug: where.album.bySlug?.slug.toString(),
				artist: where.album.bySlug ?
					where.album.bySlug?.artist
						? ArtistQueryParameters.buildQueryParametersForOne(where.album.bySlug.artist)
						: null
				: undefined
			} : undefined,
			tracks: where.library ? {
				some: TrackQueryParameters.buildQueryParametersForMany({ byLibrarySource: where.library })
			} : undefined
		};
	}

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
	 * Build the query parameters for ORM to include relations
	 * @returns the ORM-ready query parameters
	 */
	export function buildIncludeParameters(include?: RelationInclude) {
		return {
			album: include?.album ?? false,
			tracks: include?.tracks ?? false
		};
	}
}

export default ReleaseQueryParameters;