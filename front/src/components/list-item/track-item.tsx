import API from "../../api/api";
import { TrackWithRelations } from "../../models/track";
import Illustration from '../illustration';
import ListItem from "./item";
import { useDispatch } from "react-redux";
import { playTrack } from "../../state/playerSlice";
import TrackContextualMenu from "../contextual-menu/track-contextual-menu";
import { Grid } from "@mui/material";
import { useQueryClient } from "../../api/use-query";
import { MasterIcon, TrackIcon } from "../icons";

type TrackItemProps = {
	track: TrackWithRelations<'release' | 'song'>
}

/**
 * Item for a list of tracks
 * @param props
 * @returns
 */
const TrackItem = ({ track }: TrackItemProps) => {
	const release = track.release;
	const dispatch = useDispatch();
	const isMaster = track.song.masterId == track.id;
	const queryClient = useQueryClient();

	return (
		<ListItem
			icon={<Illustration illustration={track.illustration} fallback={<TrackIcon/>}/>}
			onClick={() => queryClient
				.fetchQuery(API.getSong(track.songId, ["artist"]))
				.then((song) => {
					dispatch(playTrack({ artist: song.artist, track, release }));
				})
			}
			title={track.name}
			secondTitle={release.name}
			trailing={<Grid container spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
				<Grid item sx={{ display: 'flex', alignItems: 'center' }}>
					{isMaster ? <MasterIcon/> : undefined }
				</Grid>
				<Grid item>
					{<TrackContextualMenu track={track}/>}
				</Grid>
			</Grid>}
		/>
	);
};

export default TrackItem;
