import { useDispatch } from "react-redux";
import { TrackWithRelations } from "../../models/track";
import Tile from "./tile";
import Illustration from "../illustration";
import { useQueryClient } from "../../api/use-query";
import API from "../../api/api";
import { playTrack } from "../../state/playerSlice";
import formatDuration from "../../utils/formatDuration";

type VideoTileProps = {
	video: TrackWithRelations<['song']>;
	formatSubtitle?: (video: TrackWithRelations<['song']>) => string
}

const VideoTile = ({ video, formatSubtitle }: VideoTileProps) => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();

	return <Tile
		onClick={() => Promise.all([
			queryClient.fetchQuery(() => API.getArtist(video.song.artistId)),
			queryClient.fetchQuery(() => API.getRelease(video.releaseId))
		]).then(([artist, release]) =>
			dispatch(playTrack({
				track: video,
				release: release,
				artist: artist
			})))
		}
		title={video.name}
		subtitle={formatSubtitle?.call(this, video) ?? formatDuration(video.duration)}
		illustration={
			<Illustration aspectRatio={16/9} url={video.illustration} style={{ objectFit: 'fill' }}/>
		}
	/>;
};

export default VideoTile;
