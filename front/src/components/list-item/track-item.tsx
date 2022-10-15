import API from "../../api"
import { TrackWithRelease, TrackWithSong } from "../../models/track"
import Illustration from '../illustration';
import ListItem from "./item";
import ListItemButton from "./item-button"
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import { useDispatch } from "react-redux"
import { emptyPlaylist, playTrack } from "../../state/playerSlice"
import Artist from "../../models/artist";
import { SongWithArtist } from "../../models/song";

type TrackItemProps = {
	track: TrackWithRelease & TrackWithSong;
}

/**
 * Item for a list of tracks
 * @param props 
 * @returns 
 */
const SongItem = ({ track }: TrackItemProps) => {
	const release = track.release;
	const dispatch = useDispatch();
	return (
		<ListItem
			icon={<Illustration url={track.illustration} fallback={<AudiotrackIcon/>}/>}
			title={<ListItemButton label={track.name} onClick={() => {
				API.getSong<SongWithArtist>(track.songId).then((song) => {
					dispatch(emptyPlaylist());
					dispatch(playTrack({ artist: song.artist, track, release }));
				})
			}}/>}
			secondTitle={
				<ListItemButton url={`/releases/${release.id}`} label={release.name} />
			}
		/>
	)
}

export default SongItem;