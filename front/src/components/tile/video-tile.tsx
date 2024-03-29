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

import { TrackWithRelations } from "../../models/track";
import Tile from "./tile";
import Illustration from "../illustration";
import { useQueryClient } from "../../api/use-query";
import API from "../../api/api";
import formatDuration from "../../utils/formatDuration";
import TrackContextualMenu from "../contextual-menu/track-contextual-menu";
import { usePlayerContext } from "../../contexts/player";

type VideoTileProps = {
	video: TrackWithRelations<"song"> | undefined;
	formatSubtitle?: (video: TrackWithRelations<"song">) => string;
};

const VideoTile = ({ video, formatSubtitle }: VideoTileProps) => {
	const queryClient = useQueryClient();
	const { playTrack } = usePlayerContext();

	return (
		<Tile
			contextualMenu={video && <TrackContextualMenu track={video} />}
			onClick={
				video
					? () =>
							Promise.all([
								queryClient.fetchQuery(
									API.getArtist(video.song.artistId),
								),
								queryClient.fetchQuery(
									API.getRelease(video.releaseId),
								),
							]).then(([artist, release]) =>
								playTrack({
									track: video,
									release: release,
									artist: artist,
								}),
							)
					: undefined
			}
			title={video?.name}
			subtitle={
				video
					? formatSubtitle?.call(this, video) ??
						formatDuration(video.duration)
					: undefined
			}
			illustration={
				<Illustration
					quality="medium"
					aspectRatio={16 / 9}
					illustration={video?.illustration}
					imgProps={{ objectFit: "cover" }}
				/>
			}
		/>
	);
};

export default VideoTile;
