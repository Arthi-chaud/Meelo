import { TrackType } from "@prisma/client";
import { File, Track } from "src/prisma/models";
import type FileQueryParameters from "src/file/models/file.query-parameters";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import type ReleaseQueryParameters from "src/release/models/release.query-parameters";
import type SongQueryParameters from "src/song/models/song.query-params";
import type { RequireAtLeastOne, RequireExactlyOne } from "type-fest";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import { ModelSortingParameter } from 'src/sort/models/sorting-parameter';
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";

namespace TrackQueryParameters {

	/**
	 * The input required to save a track in the database
	 */
	export type CreateInput = Omit<Track, 'id' | 'sourceFile' | 'sourceFileId' | 'release' | 'releaseId' | 'song' | 'songId'>
		& { sourceFile: FileQueryParameters.WhereInput }
		& { release: ReleaseQueryParameters.WhereInput }
		& { song: SongQueryParameters.WhereInput };

	/**
	 * Query parameters to find one track
	 */
	export type WhereInput = RequireExactlyOne<{
		id: Track['id'],
		sourceFile: FileQueryParameters.WhereInput
	}>;

	/**
	 * Query parameters to find multiple tracks
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		type: TrackType,
		id: { in: number[] }
		song: SongQueryParameters.WhereInput,
		library: LibraryQueryParameters.WhereInput,
	} & RequireExactlyOne<{
		artist: ArtistQueryParameters.WhereInput,
		album: AlbumQueryParameters.WhereInput,
		release: ReleaseQueryParameters.WhereInput,
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
		trackId: Track['id'],
		song: SongQueryParameters.WhereInput,
	};

	/**
	 * Query parameters to delete one track
	 */
	export type DeleteInput = RequireExactlyOne<Pick<WhereInput, 'id'> & { sourceFileId: File['id'] }>;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ['song', 'release'] as const;
	export const AvailableAtomicIncludes = filterAtomicRelationInclude(AvailableIncludes);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = [
		'id',
		'name',
		'releaseName',
		'duration',
		'bitrate',
		'trackIndex',
		'discIndex',
		'addDate',
		'releaseDate'
	] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}

}

export default TrackQueryParameters;
