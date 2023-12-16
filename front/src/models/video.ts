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

import Song, { SongInclude, SongRelations } from "./song";
import Track from "./track";
import * as yup from "yup";

const Video = Song.concat(
	yup.object({
		track: Track.required(),
	}),
);

type Video = yup.InferType<typeof Video>;

const VideoWithRelations = <Selection extends SongInclude | never = never>(
	relation: Selection[],
) => Video.concat(SongRelations.pick(relation));

type VideoWithRelations<Selection extends SongInclude | never = never> =
	yup.InferType<ReturnType<typeof VideoWithRelations<Selection>>>;

export default Video;
export { VideoWithRelations };
