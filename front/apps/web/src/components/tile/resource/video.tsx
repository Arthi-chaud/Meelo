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

import { useSetAtom } from "jotai";
import { getArtist } from "@/api/queries";
import type { VideoWithRelations } from "@/models/video";
import { playTrackAtom } from "@/state/player";
import { VideoIcon } from "@/ui/icons";
import formatDuration from "@/utils/format-duration";
import { useQueryClient } from "~/api";
import VideoContextualMenu from "~/components/contextual-menu/resource/video";
import Illustration from "~/components/illustration";
import Tile from "~/components/tile";

type VideoTileProps = (
	| {
			video: VideoWithRelations<"master" | "illustration"> | undefined;
			subtitle: "duration";
	  }
	| {
			video:
				| VideoWithRelations<"artist" | "master" | "illustration">
				| undefined;
			subtitle: "artist";
	  }
) & { onClick?: () => void };

const VideoTile = ({
	video,
	subtitle: subtitleType,
	onClick,
}: VideoTileProps) => {
	const queryClient = useQueryClient();
	const playTrack = useSetAtom(playTrackAtom);
	const { subtitle, secondaryHref } = !video
		? { subtitle: undefined, secondaryHref: undefined }
		: {
				subtitle:
					subtitleType === "artist"
						? video.artist.name
						: formatDuration(video.master.duration),
				secondaryHref:
					subtitleType === "artist"
						? `/artists/${video.artist.slug}`
						: undefined,
			};

	return (
		<Tile
			contextualMenu={video && <VideoContextualMenu video={video} />}
			onClick={
				video
					? () => {
							onClick?.();
							queryClient
								.fetchQuery(getArtist(video.artistId))
								.then((artist) =>
									playTrack({
										track: {
											...video.master,
											illustration: video.illustration,
										},
										featuring: undefined,
										artist: artist,
									}),
								);
						}
					: undefined
			}
			title={video?.name}
			subtitle={subtitle}
			secondaryHref={secondaryHref}
			illustration={
				<Illustration
					quality="medium"
					aspectRatio={16 / 9}
					illustration={video?.illustration}
					imgProps={{ objectFit: "cover" }}
					fallback={<VideoIcon />}
				/>
			}
		/>
	);
};

export default VideoTile;
