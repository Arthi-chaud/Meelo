import { z } from "zod";
import Illustration from "./illustration";
import Release from "./release";
import Resource from "./resource";
import Song from "./song";

/**
 * 'Instance' of a song on a release
 */
const Track = z.intersection(
	Resource,
	Illustration
).and(z.object({
	/**
	 * Unique identifier of the parent song
	 */
	songId: z.number(),
	/**
	 * Unique identifier of the parent release
	 */
	releaseId: z.number(),
	/**
	 * Title of the track
	 */
	name: z.string(),
	/**
	 * Index of the disc the track is on
	 */
	discIndex: z.number().nullable(),
	/**
	 * Index of the track on the disc
	 */
	trackIndex: z.number(),
	/**
	 * Type of media
	 */
	type: z.enum(['Audio', 'Video']),
	/**
	 * Bit rate of the track's audio.
	 * In kbits/s
	 */
	bitrate: z.number(),
	/**
	 * Duration in seconds of the track
	 */
	duration: z.number(),
	/**
	 * URL to stream track
	 */
	stream: z.string(),
	/**
	 * ID of the source file
	 */
	sourceFileId: z.number(),
}));

type Track = z.infer<typeof Track>;

type TrackInclude = 'song' | 'release';

type TrackWithRelations<I extends K[], K extends TrackInclude = TrackInclude> = Track & Pick<
	{ song: Song, release: Release },
	I[number]
>

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
export type { TrackWithRelations, TrackInclude };
