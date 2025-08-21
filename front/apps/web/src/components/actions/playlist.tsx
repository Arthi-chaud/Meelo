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
	Grid,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import type { useConfirm } from "material-ui-confirm";
import {
	HookCheckBox,
	HookTextField,
	useHookForm,
} from "mui-react-hook-form-plus";
import { useState } from "react";
import { useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import type { QueryClient } from "@/api/hook";
import { getPlaylists } from "@/api/queries";
import type { InfiniteQueryFn } from "@/api/query";
import type Playlist from "@/models/playlist";
import type {
	CreatePlaylistDto,
	PlaylistWithRelations,
	UpdatePlaylistDto,
} from "@/models/playlist";
import { playAfterAtom, playNextAtom, type TrackState } from "@/state/player";
import { store } from "@/state/store";
import {
	AddIcon,
	AddItemToPlaylistIcon,
	AddToPlaylistIcon,
	DeleteIcon,
	EditIcon,
	PlayAfterIcon,
	PlayNextIcon,
} from "@/ui/icons";
import { useQueryClient } from "~/api";
import Illustration from "~/components/illustration";
import InfiniteList from "~/components/infinite/list";
import ListItem from "~/components/list-item";
import type Action from "./";

export const PlayNextAction = (
	getTrack: () => PromiseLike<TrackState>,
): Action => ({
	onClick: () =>
		getTrack().then((track) => {
			store.set(playNextAtom, track);
			toast.success(`'${track.track.name}' will play next!`);
		}),
	label: "actions.playback.playNext",
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
	label: "actions.playback.playAfter",
	icon: <PlayAfterIcon />,
});

type CreateOrUpdatePlaylistFormProps = {
	onSubmit: (dto: CreatePlaylistDto) => void;
	onClose: () => void;
	defaultValue?: CreatePlaylistDto;
};

const CreateOrUpdatePlaylistForm = (props: CreateOrUpdatePlaylistFormProps) => {
	const defaultValues: CreatePlaylistDto = {
		name: props.defaultValue?.name ?? "",
		isPublic: props.defaultValue?.isPublic ?? true,
		allowChanges: props.defaultValue?.allowChanges ?? false,
	};
	const { registerState, handleSubmit, control, setValue } = useHookForm({
		defaultValues,
	});
	const isPublic = useWatch({ control, name: "isPublic" });
	const { t } = useTranslation();
	const onSubmit = (values: typeof defaultValues) => {
		props.onSubmit(values);
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
						rules={{
							required: {
								value: true,
								message: "Name is required",
							},
						}}
					/>
					<Grid container sx={{ paddingTop: 2 }}>
						<HookCheckBox
							{...registerState("isPublic")}
							checkBoxProps={{
								autoFocus: false,
								onChange: (_, checked) => {
									if (!checked) {
										setValue("allowChanges", false);
									}
								},
							}}
							formControlLabelProps={{
								label: t("form.playlist.playlistIsPublic"),
							}}
							gridProps={{
								size: {
									xs: 12,
									md: 6,
								},
							}}
						/>
						<HookCheckBox
							{...registerState("allowChanges")}
							checkBoxProps={{
								autoFocus: false,
								disabled: !isPublic,
							}}
							formControlLabelProps={{
								label: t("form.playlist.allowPlaylistChanges"),
							}}
							gridProps={{
								size: {
									xs: 12,
									md: 6,
								},
							}}
						/>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button onClick={props.onClose}>{t("form.cancel")}</Button>
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
	label: "actions.new",
	icon: <AddIcon />,
	dialog: ({ close }) => {
		const mutation = useMutation({
			mutationFn: (formFields: CreatePlaylistDto) => {
				return queryClient.api
					.createPlaylist(formFields)
					.then((playlist) => {
						toast.success("Playlist created!");
						queryClient.client.invalidateQueries({
							queryKey: ["playlists"],
						});
						onCreated?.(playlist.id);
					})
					.catch((error: Error) => toast.error(error.message));
			},
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
	label: "actions.update",
	icon: <EditIcon />,
	dialog: ({ close }) => {
		const mutation = useMutation({
			mutationFn: (dto: UpdatePlaylistDto) => {
				return queryClient.api
					.updatePlaylist(playlist.slug, dto)
					.then(() => {
						toast.success("Playlist updated!");
						queryClient.client.invalidateQueries({
							queryKey: ["playlists"],
						});
						queryClient.client.invalidateQueries({
							queryKey: ["playlist"],
						});
					})
					.catch((error: Error) => toast.error(error.message));
			},
		});

		return (
			<CreateOrUpdatePlaylistForm
				onClose={close}
				onSubmit={(name) => mutation.mutate(name)}
				defaultValue={playlist}
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
	label: "actions.delete",
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
					queryClient.api
						.deletePlaylist(librarySlugOrId)
						.then(() => {
							onDeleted();
							queryClient.client.invalidateQueries({
								queryKey: ["playlist"],
							});
							queryClient.client.invalidateQueries({
								queryKey: ["playlists"],
							});
							toast.success("Playlist deleted");
						})
						.catch(() => toast.error("Playlist deletion failed")),
			},
		}),
});

type SelectPlaylistFormProps = {
	playlistQuery: InfiniteQueryFn<PlaylistWithRelations<"illustration">>;
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
			<DialogTitle>{t("actions.addToPlaylist.modalTitle")}</DialogTitle>
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
					nested
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
					{t("form.cancel")}
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
	label: "actions.addToPlaylist.label",
	dialog: ({ close }) => {
		const mutation = useMutation({
			mutationFn: (playlistId: number) => {
				return queryClient.api
					.addSongToPlaylist(songId, playlistId)
					.then(() => {
						toast.success("Song added to Playlist");
						queryClient.client.invalidateQueries({
							queryKey: ["playlist"],
						});
						queryClient.client.invalidateQueries({
							queryKey: ["playlists"],
						});
					})
					.catch((error: Error) => toast.error(error.message));
			},
		});

		return (
			<SelectPlaylistForm
				onClose={close}
				onSubmit={(playlistId) => mutation.mutate(playlistId)}
				playlistQuery={() =>
					getPlaylists(
						{ changeable: true },
						{ sortBy: "creationDate", order: "desc" },
						["illustration"],
					)
				}
			/>
		);
	},
});
