import Illustration from "./illustration";
import Release from "./release";
import Resource from "./resource";
import Song from "./song";

/**
 * 'Instance' of a song on a release
 */
type Track = Resource & Illustration & {
	/**
	 * Unique identifier of the parent song
	 */
	songId: number;
	/**
	 * Unique identifier of the parent release
	 */
	releaseId: number;
	/**
	 * Title of the track
	 */
	name: string;
	/**
	 * Index of the disc the track is on
	 */
	discIndex?: number;
	/**
	 * Index of the track on the disc
	 */
	trackIndex?: number;
	/**
	 * Type of media
	 */
	type: 'Audio' | 'Video';
	/**
	 * Bit rate of the track's audio.
	 * In kbits/s
	 */
	bitrate: number;
	/**
	 * Duration in seconds of the track
	 */
	duration: number;
	/**
	 * URL to stream track
	 */
	stream: string;
	/**
	 * ID of the source file
	 */
	sourceFileId: number;
}

type TrackWithSong = Track & {
	song: Song;
}

type TrackWithRelease = Track & {
	release: Release;
}

type TrackInclude = 'song' | 'release';

export default Track;
export const TrackSortingKeys = [
	'name',
	'releaseName',
	'releaseDate',
	'bitrate',
	'addDate',
	'trackIndex',
	'discIndex'
] as const;
export type { TrackWithSong, TrackWithRelease, TrackInclude };
