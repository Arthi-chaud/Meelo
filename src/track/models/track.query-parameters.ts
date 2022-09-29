import { Prisma, Track, TrackType } from "@prisma/client";
import type FileQueryParameters from "src/file/models/file.query-parameters";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import type ReleaseQueryParameters from "src/release/models/release.query-parameters";
import type SongQueryParameters from "src/song/models/song.query-params";
import type OmitId from "src/utils/omit-id";
import type { RequireAtLeastOne } from "type-fest";
import type { RequireExactlyOne } from 'type-fest';;
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import ParseBaseRelationIncludePipe from "src/relation-include/relation-include.pipe";
import BaseSortingParameter from 'src/sort/models/sorting-parameter';
import ParseBaseSortingParameterPipe from 'src/sort/sort.pipe';
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
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
	export type WhereInput = RequireExactlyOne<{
		id: number,
		sourceFile: FileQueryParameters.WhereInput,
		masterOfSong: SongQueryParameters.WhereInput
	}>;

	/**
	 * Query parameters to find multiple tracks
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		type: TrackType,
		bySong: SongQueryParameters.WhereInput,
		byLibrarySource: LibraryQueryParameters.WhereInput,
	} & RequireExactlyOne<{
		byArtist: ArtistQueryParameters.WhereInput,
		byAlbum: AlbumQueryParameters.WhereInput,
		byRelease: ReleaseQueryParameters.WhereInput,
	}>>>;

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
	export type DeleteInput = RequireExactlyOne<Pick<WhereInput, 'id'> & { sourceFileId: number }>;

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
}

export default TrackQueryParameters;