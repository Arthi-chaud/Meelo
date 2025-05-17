/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as yup from "yup";
import Illustration from "./illustration";
import Release from "./release";
import Resource from "./resource";
import Song from "./song";
import Video from "./video";

export const TrackType = ["Audio", "Video"] as const;
export type TrackType = (typeof TrackType)[number];

/**
 * 'Instance' of a song on a release
 */
const Track = Resource.concat(
	yup.object({
		/**
		 * Unique identifier of the parent song
		 */
		songId: yup.number().required().nullable(),
		/**
		 * Unique identifier of the parent video
		 */
		videoId: yup.number().required().nullable(),
		/**
		 * Unique identifier of the parent release
		 */
		releaseId: yup.number().required().nullable(),
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
		bitrate: yup.number().required().nullable(),
		/**
		 * Duration in seconds of the track
		 */
		duration: yup.number().required().nullable(),
		/**
		 * ID of the source file
		 */
		sourceFileId: yup.number().required(),
		/**
		 * If the Track is a bonus track
		 */
		isBonus: yup.boolean().required(),
		/**
		 * If the Track is a bonus track
		 */
		isRemastered: yup.boolean().required(),
		/**
		 * If the Track is mixed with the previous/next track
		 */
		mixed: yup.boolean().required(),
	}),
);

type Track = yup.InferType<typeof Track>;

export default Track;

export type TrackInclude = "song" | "release" | "illustration" | "video";

const TrackRelations = yup.object({
	song: yup.lazy(() => Song.required().nullable()),
	video: yup.lazy(() => Video.required().nullable()),
	release: Release.required().nullable(),
	illustration: Illustration.required().nullable(),
});

export const TrackWithRelations = <Selection extends TrackInclude | never>(
	relation: Selection[],
) => Track.concat(TrackRelations.pick(relation).clone());

export type TrackWithRelations<Selection extends TrackInclude | never> =
	yup.InferType<ReturnType<typeof TrackWithRelations<Selection>>>;

export const TrackSortingKeys = [
	"name",
	"releaseName",
	"releaseDate",
	"bitrate",
	"addDate",
	"trackIndex",
	"discIndex",
] as const;
