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

import Illustration from "../illustration";
import ListItem from "./item";
import { useQueryClient } from "../../api/use-query";
import { useEffect, useState } from "react";
import { VideoIcon } from "../icons";
import formatArtists from "../../utils/formatArtists";
import { usePlayerContext } from "../../contexts/player";
import type { VideoWithRelations } from "../../models/video";
import VideoContextualMenu from "../contextual-menu/video-contextual-menu";

type VideoType = VideoWithRelations<"artist" | "master" | "illustration">;

type VideoItemProps<T extends VideoType> = {
	video: T | undefined;
	onClick?: () => void;
	subtitles?: ((video: VideoType) => Promise<string | null>)[];
};

const defaultSubtitle = (s: VideoType) => formatArtists(s.artist);

/**
 * Item for a list of videos
 * @param props
 * @returns
 */
const VideoItem = <T extends VideoType>({
	video,
	subtitles,
	onClick,
}: VideoItemProps<T>) => {
	const artist = video?.artist;
	const { playTrack } = usePlayerContext();
	const queryClient = useQueryClient();
	const [subtitle, setSubtitle] = useState<string | null | undefined>(
		subtitles?.length
			? ((<br />) as unknown as string)
			: video
				? defaultSubtitle(video)
				: undefined,
	);

	useEffect(() => {
		if (subtitles && video) {
			Promise.allSettled(subtitles.map((s) => s(video))).then((r) =>
				setSubtitle(
					r
						.map(
							(s) =>
								(s as PromiseFulfilledResult<string | null>)
									.value,
						)
						.filter((s): s is string => s !== null)
						.join(" • ") || null,
				),
			);
		}
	}, []);
	return (
		<ListItem
			icon={
				<Illustration
					illustration={video?.illustration}
					fallback={<VideoIcon />}
					quality="low"
				/>
			}
			title={video?.name}
			onClick={
				video &&
				artist &&
				(() => {
					onClick?.();
					playTrack({
						artist,
						track: {
							...video.master,
							illustration: video.illustration,
						},
					});
				})
			}
			secondTitle={subtitle}
			trailing={video && <VideoContextualMenu video={video} />}
		/>
	);
};

export default VideoItem;
