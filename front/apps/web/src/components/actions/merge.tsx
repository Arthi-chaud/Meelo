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

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import type { QueryClient } from "@/api/hook";
import { getSongs } from "@/api/queries";
import type { InfiniteQueryFn } from "@/api/query";
import type { Song, SongWithRelations } from "@/models/song";
import type { TrackWithRelations } from "@/models/track";
import { MergeIcon, SongIcon } from "@/ui/icons";
import ListItem from "~/components/list-item";
import Illustration from "../illustration";
import InfiniteList from "../infinite/list";
import type Action from ".";

export const MergeSongAction = (
	song: Song,
	queryClient: QueryClient,
): Action => ({
	icon: <MergeIcon />,
	label: "actions.song.mergeSong.label",
	dialog: ({ close }) => {
		const [selectedSongId, selectSong] = useState<number>();
		const closeModal = () => selectSong(undefined);
		const router = useRouter();
		const { t } = useTranslation();
		const mutation = useMutation({
			mutationFn: async (destSongId: number) => {
				await toast.promise(
					queryClient.api.mergeSongs(song.id, destSongId),
					{
						loading: t("misc.loading"),
						success: "Merging successfull",
						error: "error",
					},
				);
				router.replace(`/songs/${destSongId}/tracks`);
				await queryClient.client.invalidateQueries({
					queryKey: ["songs"],
				});
				await queryClient.client.invalidateQueries({
					queryKey: [song.id.toString()],
				});
				await queryClient.client.invalidateQueries({
					queryKey: [song.artistId.toString()],
				});
				await queryClient.client.invalidateQueries({
					queryKey: [song.slug],
				});
			},
		});

		return (
			<>
				<Dialog
					open={selectedSongId !== undefined}
					onClose={closeModal}
					fullWidth
					sx={{ zIndex: 999999 }}
				>
					<DialogTitle>{t("form.confirm")} ?</DialogTitle>
					<DialogContent>
						{t("actions.song.mergeSong.warningBeforeMerging")}
					</DialogContent>

					<DialogActions>
						<Button onClick={closeModal} variant="outlined">
							{t("form.cancel")}
						</Button>
						<Button
							onClick={() => {
								mutation.mutate(selectedSongId!);
								close();
							}}
						>
							{t("form.confirm")}
						</Button>
					</DialogActions>
				</Dialog>
				<SelectSongForm
					onClose={close}
					onSelect={(songId) => {
						selectSong(songId);
					}}
					songQuery={() =>
						getSongs(
							{ artist: song.artistId },
							{ sortBy: "name" },
							["illustration", "artist"],
						)
					}
				/>
			</>
		);
	},
});

export const ReassignTrackAction = (
	track: TrackWithRelations<"song"> & { song: Song },
	queryClient: QueryClient,
): Action => ({
	icon: <MergeIcon />,
	label: "actions.track.reassignTrack",
	dialog: ({ close }) => {
		const router = useRouter();
		const { t } = useTranslation();
		const mutation = useMutation({
			mutationFn: async (destSongId: number) => {
				await toast.promise(
					queryClient.api.updateTrack(track.id, destSongId),
					{
						loading: t("misc.loading"),
						success: "Merging successfull",
						error: "error",
					},
				);
				router.replace(`/songs/${destSongId}/tracks`);
				await queryClient.client.invalidateQueries({
					queryKey: ["songs"],
				});
				await queryClient.client.invalidateQueries({
					queryKey: ["tracks"],
				});
				await queryClient.client.invalidateQueries({
					queryKey: [track.id.toString()],
				});
				await queryClient.client.invalidateQueries({
					queryKey: [track.song.id.toString()],
				});
				await queryClient.client.invalidateQueries({
					queryKey: [track.song.slug],
				});
			},
		});

		return (
			<SelectSongForm
				onClose={close}
				onSelect={(songId) => {
					mutation.mutate(songId);
					close();
				}}
				songQuery={() =>
					getSongs(
						{ artist: track.song?.artistId },
						{ sortBy: "name" },
						["illustration", "artist"],
					)
				}
			/>
		);
	},
});

// TODO it's a bit too similar to 'SelectPlaylistForm'

type SelectSongFormProps = {
	songQuery: InfiniteQueryFn<SongWithRelations<"illustration" | "artist">>;
	onSelect: (songId: number) => void;
	onClose: () => void;
};

const SelectSongForm = (props: SelectSongFormProps) => {
	const { t } = useTranslation();

	return (
		<>
			<DialogTitle>{t("actions.song.mergeSong.modalTitle")}</DialogTitle>
			<DialogContent>
				<InfiniteList
					nested
					query={props.songQuery}
					render={(item, _, index) => (
						<ListItem
							key={index}
							title={item?.name}
							icon={
								<Illustration
									illustration={item?.illustration}
									fallback={<SongIcon />}
									quality="low"
								/>
							}
							secondTitle={item?.artist?.name}
							onClick={
								item &&
								(() => {
									props.onSelect(item.id);
								})
							}
						/>
					)}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onClose} variant="outlined">
					{t("form.cancel")}
				</Button>
			</DialogActions>
		</>
	);
};
