import * as yup from "yup";
import Illustration from "./illustration";
import Release from "./release";
import Resource from "./resource";
import Song from "./song";

export const TrackType = ["Audio", "Video"] as const;
export type TrackType = (typeof TrackType)[number];

/**
 * 'Instance' of a song on a release
 */
const Track = Resource.concat(Illustration).concat(
	yup.object({
		/**
		 * Unique identifier of the parent song
		 */
		songId: yup.number().required(),
		/**
		 * Unique identifier of the parent release
		 */
		releaseId: yup.number().required(),
		/**
		 * Title of the track
		 */
		name: yup.string().required(),
		/**
		 * Index of the disc the track is on
		 */
		discIndex: yup.number().required().nullable(),
		/**
		 * Index of the track on the disc
		 */
		trackIndex: yup.number().required().nullable(),
		/**
		 * Type of media
		 */
		type: yup.mixed<TrackType>().oneOf(TrackType).required(),
		/**
		 * Bit rate of the track's audio.
		 * In kbits/s
		 */
		bitrate: yup.number().required(),
		/**
		 * Duration in seconds of the track
		 */
		duration: yup.number().required(),
		/**
		 * URL to stream track
		 */
		stream: yup.string().required(),
		/**
		 * ID of the source file
		 */
		sourceFileId: yup.number().required(),
		/**
		 * If the Track is a bonus track
		 */
		isBonus: yup.boolean().required(),
	}),
);

type Track = yup.InferType<typeof Track>;

export default Track;

export type TrackInclude = "song" | "release";

const TrackRelations = yup.object({
	song: Song.required(),
	release: Release.required(),
});

const TrackWithRelations = <Selection extends TrackInclude | never>(
	relation: Selection[],
) => Track.concat(TrackRelations.pick(relation).clone());

type TrackWithRelations<Selection extends TrackInclude | never> = yup.InferType<
	ReturnType<typeof TrackWithRelations<Selection>>
>;

export const TrackSortingKeys = [
	"name",
	"releaseName",
	"releaseDate",
	"bitrate",
	"addDate",
	"trackIndex",
	"discIndex",
] as const;

export { TrackWithRelations };
