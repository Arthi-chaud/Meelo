import { Grid } from "@mui/material";
import API from "../api/api";
import { playTrack } from "../state/playerSlice";
import SongContextualMenu from "./contextual-menu/song-contextual-menu";
import Illustration from "./illustration";
import { SongWithRelations } from "../models/song";
import { useQueryClient } from "../api/use-query";
import { useDispatch } from "react-redux";
import ListItem from "./list-item/item";
import formatArtists from "../utils/formatArtists";

type SongGridProps = {
	songs: SongWithRelations<"artist" | "featuring">[];
	parentArtistName?: string; // To tell wheter or not we display the artists' names
};

const SongGrid = ({ songs, parentArtistName }: SongGridProps) => {
	const queryClient = useQueryClient();
	const dispatch = useDispatch();

	return (
		<Grid container spacing={2} sx={{ display: "flex", flexGrow: 1 }}>
			{songs.map((song) => (
				<Grid key={song.id} item xs={12} sm={6} lg={4}>
					<ListItem
						icon={
							<Illustration
								illustration={song.illustration}
								quality="low"
							/>
						}
						title={song.name}
						secondTitle={
							(
								parentArtistName === song.artist.name &&
								song.featuring.length == 0
							) ?
								undefined
							:	formatArtists(song.artist, song.featuring)
						}
						trailing={
							<SongContextualMenu
								song={{ ...song, artist: song.artist }}
							/>
						}
						onClick={() =>
							queryClient
								.fetchQuery(
									API.getMasterTrack(song.id, ["release"]),
								)
								.then((track) => {
									dispatch(
										playTrack({
											artist: song.artist,
											track,
											release: track.release,
										}),
									);
								})
						}
					/>
				</Grid>
			))}
		</Grid>
	);
};

export default SongGrid;
