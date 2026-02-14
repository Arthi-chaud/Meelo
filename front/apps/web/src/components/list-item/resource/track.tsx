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
import { useTranslation } from "react-i18next";
import { getArtist } from "@/api/queries";
import type { TrackWithRelations } from "@/models/track";
import { playTrackAtom } from "@/state/player";
import { MasterIcon, TrackIcon } from "@/ui/icons";
import { useQueryClient } from "~/api";
import TrackContextualMenu from "~/components/contextual-menu/resource/track";
import Illustration from "~/components/illustration";
import ListItem from "~/components/list-item";

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
	const { t } = useTranslation();
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
							getArtist((track.song ?? track.video)!.artistId),
						)
						.then((artist) => {
							playTrack({
								artist,
								track,
								featuring: undefined,
							});
						});
				})
			}
			title={track?.name}
			secondTitle={[
				release?.name ?? null,
				track?.mixed ? t("track.mixed") : null,
				track?.isRemastered ? t("track.remastered") : null,
			]
				.filter((s) => !!s)
				.join(" — ")}
			trailing={
				<Grid
					container
					spacing={1}
					sx={{ justifyContent: "flex-end", flexWrap: "nowrap" }}
				>
					<Grid sx={{ display: "flex", alignItems: "center" }}>
						{track?.song && isMaster ? <MasterIcon /> : undefined}
					</Grid>
					<Grid>
						{track && <TrackContextualMenu track={track} />}
					</Grid>
				</Grid>
			}
		/>
	);
};

export default TrackItem;
