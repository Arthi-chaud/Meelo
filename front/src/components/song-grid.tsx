import { Grid } from "@mui/material";
import API from "../api/api";
import { playTrack } from "../state/playerSlice";
import SongContextualMenu from "./contextual-menu/song-contextual-menu";
import Illustration from "./illustration";
import { SongWithRelations } from "../models/song";
import { useQueryClient } from "../api/use-query";
import { useDispatch } from "react-redux";
import ListItem from "./list-item/item";

type SongGridProps = {
	songs: SongWithRelations<'artist'>[];
	hideArtistName?: true,
}

const SongGrid = ({ songs, hideArtistName }: SongGridProps) => {
	const queryClient = useQueryClient();
	const dispatch = useDispatch();

	return <Grid container spacing={2}
		sx={{ display: 'flex', flexGrow: 1 }}>
		{ songs.map((song) =>
			<Grid key={song.id} item xs={12} sm={6} lg={4}>
				<ListItem
					icon={<Illustration illustration={song.illustration}/>}
					title={song.name}
					secondTitle={hideArtistName == true ? undefined : song.artist.name}
					trailing={<SongContextualMenu
						song={{ ...song, artist: song.artist }}
					/>}
					onClick={() => queryClient
						.fetchQuery(API.getMasterTrack(song.id, ['release']))
						.then((track) => {
							dispatch(playTrack({
								artist: song.artist,
								track,
								release: track.release
							}));
						})
					}
				/>
			</Grid>)}
	</Grid>;
};

export default SongGrid;
