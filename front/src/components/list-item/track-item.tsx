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

import API from "../../api/api";
import { TrackWithRelations } from "../../models/track";
import Illustration from "../illustration";
import ListItem from "./item";
import { useDispatch } from "react-redux";
import { playTrack } from "../../state/playerSlice";
import TrackContextualMenu from "../contextual-menu/track-contextual-menu";
import { Grid } from "@mui/material";
import { useQueryClient } from "../../api/use-query";
import { MasterIcon, TrackIcon } from "../icons";

type TrackItemProps = {
	track: TrackWithRelations<"release" | "song">;
};

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
			icon={
				<Illustration
					illustration={track.illustration}
					fallback={<TrackIcon />}
					quality="low"
				/>
			}
			onClick={() =>
				queryClient
					.fetchQuery(API.getSong(track.songId, ["artist"]))
					.then((song) => {
						dispatch(
							playTrack({ artist: song.artist, track, release }),
						);
					})
			}
			title={track.name}
			secondTitle={release.name}
			trailing={
				<Grid
					container
					spacing={1}
					sx={{ justifyContent: "flex-end", flexWrap: "nowrap" }}
				>
					<Grid item sx={{ display: "flex", alignItems: "center" }}>
						{isMaster ? <MasterIcon /> : undefined}
					</Grid>
					<Grid item>{<TrackContextualMenu track={track} />}</Grid>
				</Grid>
			}
		/>
	);
};

export default TrackItem;
