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
	songs: (SongWithRelations<"artist" | "featuring"> | undefined)[];
	parentArtistName?: string; // To tell wheter or not we display the artists' names
};

const SongGrid = ({ songs, parentArtistName }: SongGridProps) => {
	const queryClient = useQueryClient();
	const dispatch = useDispatch();

	return (
		<Grid container spacing={2} sx={{ display: "flex", flexGrow: 1 }}>
			{songs.map((song, index) => (
				<Grid
					key={song?.id ?? `skeleton-${index}`}
					item
					xs={12}
					sm={6}
					lg={4}
				>
					<ListItem
						icon={
							<Illustration
								illustration={song?.illustration}
								quality="low"
							/>
						}
						title={song?.name}
						secondTitle={
							song
								? parentArtistName === song.artist.name &&
									song.featuring.length == 0
									? null
									: formatArtists(song.artist, song.featuring)
								: undefined
						}
						trailing={
							song && (
								<SongContextualMenu
									song={{ ...song, artist: song.artist }}
								/>
							)
						}
						onClick={
							song
								? () =>
										queryClient
											.fetchQuery(
												API.getMasterTrack(song.id, [
													"release",
												]),
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
								: undefined
						}
					/>
				</Grid>
			))}
		</Grid>
	);
};

export default SongGrid;
