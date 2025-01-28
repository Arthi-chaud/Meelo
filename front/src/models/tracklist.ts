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
import Song, { type SongInclude, SongRelations } from "./song";
import { TrackWithRelations } from "./track";
import Video, { VideoRelations } from "./video";

export const TracklistItem = TrackWithRelations(["illustration"])
	.concat(
		yup.object({
			song: Song.required().nullable(),
			video: Video.required().nullable(),
		}),
	)
	.required();

export const TracklistItemWithRelations = <
	Selection extends SongInclude | never,
>(
	selection: Selection[],
) =>
	TrackWithRelations(["illustration"])
		.concat(
			yup.object({
				song: Song.concat(SongRelations.pick(selection)).nullable(),
				video: Video.concat(
					VideoRelations.pick(
						selection.includes("artist" as Selection)
							? ["artist"]
							: [],
					),
				).nullable(),
			}),
		)
		.required();

export type TracklistItem = yup.InferType<typeof TracklistItem>;
export type TracklistItemWithRelations<Selection extends SongInclude | never> =
	yup.InferType<ReturnType<typeof TracklistItemWithRelations<Selection>>>;

type Tracklist<T> = Record<string | "?", T[]>;

export default Tracklist;
