import API from "../../api/api";
import { SongWithRelations } from "../../models/song";
import Illustration from '../illustration';
import ListItem from "./item";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import { useDispatch } from "react-redux";
import { playTrack } from "../../state/playerSlice";
import SongContextualMenu from "../contextual-menu/song-contextual-menu";
import { useQueryClient } from "../../api/use-query";

type SongItemProps = {
	song: SongWithRelations<['artist']>;
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
	const queryClient = useQueryClient();

	return (
		<ListItem
			icon={<Illustration url={song.illustration} fallback={<AudiotrackIcon/>}/>}
			title={song.name}
			onClick={() => queryClient
				.fetchQuery((id) => API.getMasterTrack(id, ['release']), song.id)
				.then((track) => {
					dispatch(playTrack({
						artist,
						track,
						release: track.release
					}));
				})
			}
			secondTitle={hideArtist === true ? undefined : artist.name}
			trailing={<SongContextualMenu song={song}/>}
		/>
	);
};

export default SongItem;
