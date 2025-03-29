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
import { useSetAtom } from "jotai";
import type { SongWithRelations } from "../models/song";
import { playTrackAtom } from "../state/player";
import formatArtists from "../utils/formatArtists";
import SongContextualMenu from "./contextual-menu/resource/song";
import { SongIcon } from "./icons";
import Illustration from "./illustration";
import ListItem from "./list-item";

type SongGridProps = {
	songs: (
		| SongWithRelations<"artist" | "featuring" | "master" | "illustration">
		| undefined
	)[];
	parentArtistName?: string; // To tell wheter or not we display the artists' names
};

const SongGrid = ({ songs, parentArtistName }: SongGridProps) => {
	const playTrack = useSetAtom(playTrackAtom);
	return (
		<Grid container spacing={2} sx={{ display: "flex", flexGrow: 1 }}>
			{songs.map((song, index) => (
				<Grid
					key={song?.id ?? `song-grid-skeleton-${index}`}
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
								fallback={<SongIcon />}
							/>
						}
						title={song?.name}
						secondTitle={
							song
								? parentArtistName === song.artist.name &&
									song.featuring.length === 0
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
										playTrack({
											artist: song.artist,
											track: {
												...song.master,
												illustration: song.illustration,
											},
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
