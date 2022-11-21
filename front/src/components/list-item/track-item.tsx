import API from "../../api";
import { TrackWithRelease, TrackWithSong } from "../../models/track";
import Illustration from '../illustration';
import ListItem from "./item";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import { useDispatch } from "react-redux";
import { playTrack } from "../../state/playerSlice";
import { SongWithArtist } from "../../models/song";
import StarIcon from "@mui/icons-material/Star";
import TrackContextualMenu from "../contextual-menu/track-contextual-menu";
import { Grid } from "@mui/material";

type TrackItemProps = {
	track: TrackWithRelease & TrackWithSong
}

/**
 * Item for a list of tracks
 * @param props
 * @returns
 */
const TrackItem = ({ track }: TrackItemProps) => {
	const release = track.release;
	const dispatch = useDispatch();

	return (
		<ListItem
			icon={<Illustration url={track.illustration} fallback={<AudiotrackIcon/>}/>}
			onClick={() => {
				API.getSong<SongWithArtist>(track.songId, ["artist"]).then((song) => {
					dispatch(playTrack({ artist: song.artist, track, release }));
				});
			}}
			title={track.name}
			secondTitle={release.name}
			trailing={<Grid container spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
				<Grid item sx={{ display: 'flex', alignItems: 'center' }}>
					{track.master ? <StarIcon/> : undefined }
				</Grid>
				<Grid item>
					{<TrackContextualMenu track={track}/>}
				</Grid>
			</Grid>}
		/>
	);
};

export default TrackItem;
