import { Prisma, Track, TrackType } from "@prisma/client";
import FileQueryParameters from "src/file/models/file.query-parameters";
import LibraryQueryParameters from "src/library/models/library.query-parameters";
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import SongQueryParameters from "src/song/models/song.query-params";
import type OmitId from "src/utils/omit-id";
import type RequireAtLeastOne from "src/utils/require-at-least-one";
import type RequireOnlyOne from "src/utils/require-only-one";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import ParseBaseRelationIncludePipe from "src/relation-include/relation-include.pipe";
import BaseSortingParameter from 'src/sort/models/sorting-parameter';
import ParseBaseSortingParameterPipe from 'src/sort/sort.pipe';
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";

namespace TrackQueryParameters {
	type OmitSong<T> = Omit<T, 'songId'>;
	type OmitSourceFile<T> = Omit<T, 'sourceFileId'>;
	type OmitRelease<T> = Omit<T, 'releaseId'>;

	/**
	 * The input required to save a track in the database
	 */
	export type CreateInput = OmitRelease<OmitSourceFile<OmitSong<OmitId<Track>>>>
		& { sourceFile: FileQueryParameters.WhereInput }
		& { release: ReleaseQueryParameters.WhereInput }
		& { song: SongQueryParameters.WhereInput };

	/**
	 * Query parameters to find one track
	 */
	export type WhereInput = RequireOnlyOne<{
		id: number,
		sourceFile: FileQueryParameters.WhereInput,
		masterOfSong: SongQueryParameters.WhereInput
	}>;

	/**
	 * Build the query parameters for ORM, to select one track
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForOne(where: WhereInput) {
		return {
			id: where.id,
			master: where.masterOfSong ? true : undefined,
			song: where.masterOfSong ?
				SongQueryParameters.buildQueryParametersForOne(where.masterOfSong)
			: undefined,
			sourceFile: where.sourceFile ?
				FileQueryParameters.buildQueryParametersForOne(where.sourceFile)
			: undefined
		}
	}

	/**
	 * Query parameters to find multiple tracks
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		type: TrackType,
		bySong: SongQueryParameters.WhereInput,
		byLibrarySource: LibraryQueryParameters.WhereInput,
	} & RequireOnlyOne<{
		byArtist: ArtistQueryParameters.WhereInput,
		byAlbum: AlbumQueryParameters.WhereInput,
		byRelease: ReleaseQueryParameters.WhereInput,
	}>>>;

	/**
	 * Build the query parameters for ORM, to select multiple rows
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForMany(where: ManyWhereInput): Prisma.TrackWhereInput {
		let queryParameters: Prisma.TrackWhereInput = {
			type: where.type,
			song: where.bySong ? SongQueryParameters.buildQueryParametersForOne(where.bySong) : undefined,
			sourceFile: where.byLibrarySource ? {
				library: LibraryQueryParameters.buildQueryParametersForOne(where.byLibrarySource)
			} : undefined,
		};
		if (where.byRelease) {
			queryParameters = {
				...queryParameters,
				release: ReleaseQueryParameters.buildQueryParametersForOne(where.byRelease)
			}
		}
		if (where.byAlbum) {
			queryParameters = {
				...queryParameters,
				release: {
					album: AlbumQueryParameters.buildQueryParametersForOne(where.byAlbum!)	
				}
			}
		}
		if (where.byArtist) {
			queryParameters = {
				...queryParameters,
				release: {
					album: AlbumQueryParameters.buildQueryParametersForMany({ byArtist: where.byArtist })
				}
			}
		}
		return queryParameters;
	}

	/**
	 * The input required to update a track in the database
	 */
	export type UpdateInput = Partial<CreateInput>;

	/**
	 * The input to find or create a track
	 */
	export type GetOrCreateInput = CreateInput;

	/**
	 * Parameters to update the master track of a song
	 */
	export type UpdateSongMaster = {
		trackId: number, 
		song: SongQueryParameters.WhereInput,
	};

	/**
	 * Query parameters to delete one track
	 */
	export type DeleteInput = RequireOnlyOne<Pick<WhereInput, 'id'> & { sourceFileId: number }>;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ['song', 'release'] as const;
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;
	export const ParseRelationIncludePipe = new ParseBaseRelationIncludePipe(AvailableIncludes);

	/**
	 * Defines how to sort fetched entries
	 */
	export const AvailableFields = Object.values(Prisma.TrackScalarFieldEnum);
	export class SortingParameter extends BaseSortingParameter<typeof AvailableFields>{};
	export const ParseSortingParameterPipe = new ParseBaseSortingParameterPipe(AvailableFields);

	/**
	 * Build the query parameters for ORM to include relations
	 * @returns the ORM-ready query parameters
	 */
	export function buildIncludeParameters(include?: RelationInclude) {
		return {
			release: include?.release ?? false,
			song: include?.song ?? false
		};
	}
}

export default TrackQueryParameters;