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
import API from "~/api";
import { useQueryClient } from "~/api/use-query";
import TrackContextualMenu from "~/components/contextual-menu/resource/track";
import { MasterIcon, TrackIcon } from "~/components/icons";
import Illustration from "~/components/illustration";
import ListItem from "~/components/list-item";
import type { TrackWithRelations } from "~/models/track";
import { playTrackAtom } from "~/state/player";

type TrackItemProps = {
	track:
		| TrackWithRelations<"video" | "release" | "song" | "illustration">
		| undefined;
	onClick?: () => void;
};

/**
 * Item for a list of tracks
 * @param props
 * @returns
 */
const TrackItem = ({ track, onClick }: TrackItemProps) => {
	const release = track?.release;
	const isMaster = track ? track.song?.masterId === track.id : false;
	const queryClient = useQueryClient();
	const playTrack = useSetAtom(playTrackAtom);

	return (
		<ListItem
			icon={
				<Illustration
					illustration={track?.illustration}
					fallback={<TrackIcon />}
					quality="low"
				/>
			}
			onClick={
				track &&
				(() => {
					onClick?.();
					queryClient
						.fetchQuery(
							track.song
								? API.getArtist(track.song.artistId)
								: API.getArtist(track.video!.artistId),
						)
						.then((artist) => {
							playTrack({
								artist,
								track,
							});
						});
				})
			}
			title={track?.name}
			secondTitle={release?.name ?? null}
			trailing={
				<Grid
					container
					spacing={1}
					sx={{ justifyContent: "flex-end", flexWrap: "nowrap" }}
				>
					<Grid item sx={{ display: "flex", alignItems: "center" }}>
						{track?.song && isMaster ? <MasterIcon /> : undefined}
					</Grid>
					<Grid item>
						{track && <TrackContextualMenu track={track} />}
					</Grid>
				</Grid>
			}
		/>
	);
};

export default TrackItem;
