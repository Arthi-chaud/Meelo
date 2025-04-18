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
	Divider,
} from "@mui/material";
import { Add, Edit } from "iconsax-react";
import type { useConfirm } from "material-ui-confirm";
import { HookTextField, useHookForm } from "mui-react-hook-form-plus";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import API from "~/api";
import {
	type MeeloInfiniteQueryFn,
	type QueryClient,
	useQueryClient,
} from "~/api/use-query";
import {
	AddItemToPlaylistIcon,
	AddToPlaylistIcon,
	DeleteIcon,
	PlayAfterIcon,
	PlayNextIcon,
} from "~/components/icons";
import Illustration from "~/components/illustration";
import InfiniteList from "~/components/infinite/list";
import ListItem from "~/components/list-item";
import type Playlist from "~/models/playlist";
import type { PlaylistWithRelations } from "~/models/playlist";
import { type TrackState, playAfterAtom, playNextAtom } from "~/state/player";
import { store } from "~/state/store";
import type Action from "./";

export const PlayNextAction = (
	getTrack: () => PromiseLike<TrackState>,
): Action => ({
	onClick: () =>
		getTrack().then((track) => {
			store.set(playNextAtom, track);
			toast.success(`'${track.track.name}' will play next!`);
		}),
	label: "playNext",
	icon: <PlayNextIcon />,
});

export const PlayAfterAction = (
	getTrack: () => PromiseLike<TrackState>,
): Action => ({
	onClick: () =>
		getTrack().then((track) => {
			store.set(playAfterAtom, track);
			toast.success(`'${track.track.name}' will play after!`);
		}),
	label: "playAfter",
	icon: <PlayAfterIcon />,
});

type CreateOrUpdatePlaylistFormProps = {
	onSubmit: (playlistName: string) => void;
	onClose: () => void;
	defaultValue?: string;
};

const CreateOrUpdatePlaylistForm = (props: CreateOrUpdatePlaylistFormProps) => {
	const defaultValues = { name: props.defaultValue ?? "" };
	const { registerState, handleSubmit } = useHookForm({
		defaultValues,
	});
	const { t } = useTranslation();
	const onSubmit = (values: typeof defaultValues) => {
		props.onSubmit(values.name);
		props.onClose();
	};

	return (
		<>
			<DialogTitle>
				{props.defaultValue ? "Update" : "Create"} Playlist
			</DialogTitle>
			<form
				onSubmit={handleSubmit(onSubmit)}
				style={{ width: "100%", height: "100%" }}
			>
				<DialogContent>
					<HookTextField
						{...registerState("name")}
						textFieldProps={{
							autoFocus: true,
							fullWidth: true,
							label: "Enter name of the playlist",
						}}
						gridProps={{}}
						rules={{
							required: {
								value: true,
								message: "Name is required",
							},
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={props.onClose}>{t("cancel")}</Button>
					<Button type="submit" color="primary" variant="contained">
						{props.defaultValue ? "Update" : "Create"}
					</Button>
				</DialogActions>
			</form>
		</>
	);
};

export const CreatePlaylistAction = (
	queryClient: QueryClient,
	onCreated?: (playlistId: number) => void,
): Action => ({
	label: "new",
	icon: <Add />,
	dialog: ({ close }) => {
		const mutation = useMutation((playlistName: string) => {
			return API.createPlaylist(playlistName)
				.then((playlist) => {
					toast.success("Playlist created!");
					queryClient.client.invalidateQueries("playlists");
					onCreated?.(playlist.id);
				})
				.catch((error: Error) => toast.error(error.message));
		});

		return (
			<CreateOrUpdatePlaylistForm
				onClose={close}
				onSubmit={(name) => mutation.mutate(name)}
			/>
		);
	},
});

export const UpdatePlaylistAction = (
	playlist: Playlist,
	queryClient: QueryClient,
): Action => ({
	label: "update",
	icon: <Edit />,
	dialog: ({ close }) => {
		const mutation = useMutation((playlistName: string) => {
			return API.updatePlaylist(playlistName, playlist.slug)
				.then(() => {
					toast.success("Playlist updated!");
					queryClient.client.invalidateQueries("playlists");
					queryClient.client.invalidateQueries("playlist");
				})
				.catch((error: Error) => toast.error(error.message));
		});

		return (
			<CreateOrUpdatePlaylistForm
				onClose={close}
				onSubmit={(name) => mutation.mutate(name)}
				defaultValue={playlist.name}
			/>
		);
	},
});

export const DeletePlaylistAction = (
	confirm: ReturnType<typeof useConfirm>,
	queryClient: QueryClient,
	librarySlugOrId: number | string,
	onDeleted: () => void,
): Action => ({
	label: "delete",
	icon: <DeleteIcon />,
	onClick: () =>
		confirm({
			title: "Delete Playlist",
			description:
				"You are about to delete a playlist. This can not be undone.",
			confirmationText: "Delete Playlist",
			confirmationButtonProps: {
				variant: "outlined",
				color: "error",
				onClickCapture: () =>
					API.deletePlaylist(librarySlugOrId)
						.then(() => {
							onDeleted();
							queryClient.client.invalidateQueries("playlist");
							queryClient.client.invalidateQueries("playlists");
							toast.success("Playlist deleted");
						})
						.catch(() => toast.error("Playlist deletion failed")),
			},
		}),
});

type SelectPlaylistFormProps = {
	playlistQuery: MeeloInfiniteQueryFn<PlaylistWithRelations<"illustration">>;
	onSubmit: (playlistId: number) => void;
	onClose: () => void;
};

const SelectPlaylistForm = (props: SelectPlaylistFormProps) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const createPlaylistAction = CreatePlaylistAction(queryClient);
	const [openModal, setOpenModal] = useState(false);
	const closeModal = () => setOpenModal(false);

	return (
		<>
			<Dialog
				open={openModal}
				onClose={closeModal}
				fullWidth
				sx={{ zIndex: 999999 }}
			>
				{createPlaylistAction.dialog?.({ close: closeModal })}
			</Dialog>
			<DialogTitle>Select a playlist</DialogTitle>
			<DialogContent>
				<ListItem
					title={t(createPlaylistAction.label!)}
					icon={
						<Illustration
							illustration={null}
							fallback={createPlaylistAction.icon}
							quality="low"
						/>
					}
					onClick={() => setOpenModal(true)}
					secondTitle={null}
				/>
				<Divider sx={{ paddingTop: 1 }} />
				<InfiniteList
					query={props.playlistQuery}
					render={(item, _, index) => (
						<ListItem
							key={index}
							title={item?.name}
							icon={
								<Illustration
									illustration={item?.illustration}
									fallback={<AddItemToPlaylistIcon />}
									quality="low"
								/>
							}
							secondTitle={null}
							onClick={
								item &&
								(() => {
									props.onSubmit(item.id);
									props.onClose();
								})
							}
						/>
					)}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onClose} variant="outlined">
					{t("cancel")}
				</Button>
			</DialogActions>
		</>
	);
};

export const AddToPlaylistAction = (
	songId: number,
	queryClient: QueryClient,
): Action => ({
	icon: <AddToPlaylistIcon />,
	label: "addToPlaylist",
	dialog: ({ close }) => {
		const mutation = useMutation((playlistId: number) => {
			return API.addSongToPlaylist(songId, playlistId)
				.then(() => {
					toast.success("Song added to Playlist");
					queryClient.client.invalidateQueries("playlists");
					queryClient.client.invalidateQueries("playlist");
				})
				.catch((error: Error) => toast.error(error.message));
		});

		return (
			<SelectPlaylistForm
				onClose={close}
				onSubmit={(playlistId) => mutation.mutate(playlistId)}
				playlistQuery={() =>
					API.getPlaylists(
						{},
						{ sortBy: "creationDate", order: "desc" },
						["illustration"],
					)
				}
			/>
		);
	},
});
