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

import Artist from "./artist";
import Illustration from "./illustration";
import Resource from "./resource";
import Song from "./song";
import Track from "./track";
import * as yup from "yup";

export const VideoType = [
	"MusicVideo",
	"LyricsVideo",
	"Live",
	"BehindTheScenes",
	"Interview",
	"Advert",
	"PhotoGallery",
	"Documentary",
	"Other",
] as const;

export const VideoTypeIsExtra = (vType: VideoType) =>
	!["MusicVideo", "LyricsVideo", "Live"].includes(vType);

export type VideoType = (typeof VideoType)[number];

const Video = Resource.concat(
	yup.object({
		id: yup.number().required(),
		slug: yup.string().required(),
		name: yup.string().required(),
		nameSlug: yup.string().required(),
		artistId: yup.number().required(),
		songId: yup.number().required().nullable(),
		groupId: yup.number().required().nullable(),
		registeredAt: yup.date().required(),
		type: yup.mixed<VideoType>().oneOf(VideoType).required(),
	}),
);

type Video = yup.InferType<typeof Video>;

export type VideoInclude = "artist" | "song" | "illustration" | "master";
export const VideoRelations = yup.object({
	artist: Artist.required(),
	song: yup.lazy(() => Song.required().nullable()),
	master: yup.lazy(() => Track.required()),
	illustration: Illustration.required().nullable(),
});

const VideoWithRelations = <Selection extends VideoInclude | never = never>(
	relation: Selection[],
) => Video.concat(VideoRelations.pick(relation));

type VideoWithRelations<Selection extends VideoInclude | never = never> =
	yup.InferType<ReturnType<typeof VideoWithRelations<Selection>>>;

export default Video;
export const videoTypeIsExtra = (type: VideoType) =>
	[
		"BehindTheScenes",
		"Interview",
		"Advert",
		"PhotoGallery",
		"Documentary",
	].includes(type);
export const VideoSortingKeys = ["name", "artistName", "addDate"] as const;
export { VideoWithRelations };
