import API from "../../api/api";
import { SongWithArtist } from "../../models/song";
import { TrackWithRelease } from "../../models/track";
import Illustration from '../illustration';
import ListItem from "./item";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import { useDispatch } from "react-redux";
import { playTrack } from "../../state/playerSlice";
import SongContextualMenu from "../contextual-menu/song-contextual-menu";

type SongItemProps = {
	song: SongWithArtist;
	hideArtist?: boolean;
}

/**
 * Item for a list of songs
 * @param props
 * @returns
 */
const SongItem = ({ song, hideArtist }: SongItemProps) => {
	const artist = song.artist;
	const dispatch = useDispatch();

	return (
		<ListItem
			icon={<Illustration url={song.illustration} fallback={<AudiotrackIcon/>}/>}
			title={song.name}
			onClick={() => {
				API.getMasterTrack<TrackWithRelease>(song.id, ['release']).then((track) => {
					dispatch(playTrack({
						artist,
						track,
						release: track.release
					}));
				});
			}}
			secondTitle={hideArtist === true ? undefined : artist.name}
			trailing={<SongContextualMenu song={song}/>}
		/>
	);
};

export default SongItem;
