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

import { QueryClient } from "../../api/use-query";
import Action from "./action";
import { useConfirm } from "material-ui-confirm";
import store from "../../state/store";
import { Chip, Grid } from "@mui/material";
import { useState } from "react";
import toast from "react-hot-toast";
import { EditIcon } from "../icons";
import { useTranslation } from "react-i18next";
import { TranslationKey } from "../../i18n/i18n";
import Song, { SongType } from "../../models/song";
import API from "../../api/api";
import Album, { AlbumType } from "../../models/album";
import Video, { VideoType } from "../../models/video";

const ResourceTypeForm = <Enum extends TranslationKey>(props: {
	defaultValue?: Enum;
	values: readonly Enum[];
	onSelect: (type: Enum) => void;
}) => {
	const [currentType, setType] = useState(props.defaultValue);
	const { t } = useTranslation();

	return (
		<>
			<Grid container spacing={2} justifyContent="center">
				{props.values.map((type) => (
					<Grid item key={type}>
						<Chip
							label={t(type) as string}
							variant={
								type == currentType ? "filled" : "outlined"
							}
							onClick={() => {
								setType(type);
								props.onSelect(type);
							}}
						/>
					</Grid>
				))}
			</Grid>
		</>
	);
};

const ChangeResourceType = <
	T extends { type: TypeEnum },
	TypeEnum extends TranslationKey,
>(
	resource: T,
	types: readonly TypeEnum[],
	label: TranslationKey,
	queryClient: QueryClient,
	onSelect: (newType: TypeEnum) => Promise<void>,
	confirm: ReturnType<typeof useConfirm>,
): Action => {
	return {
		label: label,
		icon: <EditIcon />,
		disabled: store.getState().user.user?.admin !== true,
		onClick: () =>
			confirm({
				title: <br />,
				description: (
					<ResourceTypeForm
						defaultValue={resource.type}
						values={types}
						onSelect={(type) =>
							toast
								.promise(onSelect(type), {
									loading: null,
									success: "Update successful!",
									error: "Update failed...",
								})
								.then(() => {
									queryClient.client.invalidateQueries(
										"songs",
									);
									queryClient.client.invalidateQueries(
										"release",
									);
									queryClient.client.invalidateQueries(
										"tracks",
									);
									queryClient.client.invalidateQueries(
										"videos",
									);
									queryClient.client.invalidateQueries(
										"bsides",
									);
								})
						}
					/>
				),
				cancellationButtonProps: { sx: { display: "none" } },
				confirmationText: "OK",
			}),
	};
};

const ChangeSongType = (
	s: Song,
	client: QueryClient,
	confirm: ReturnType<typeof useConfirm>,
) =>
	ChangeResourceType(
		s,
		SongType.filter((t) => t != "Unknown"),
		"changeSongType",
		client,
		(newType: SongType) =>
			API.updateSong(s.id, { type: newType }).then((res) => {
				client.client.invalidateQueries("songs");
				client.client.invalidateQueries("release");
				client.client.invalidateQueries("tracks");
				client.client.invalidateQueries("videos");
				client.client.invalidateQueries("bsides");
				return res;
			}),
		confirm,
	);

const ChangeAlbumType = (
	a: Album,
	client: QueryClient,
	confirm: ReturnType<typeof useConfirm>,
) =>
	ChangeResourceType(
		a,
		AlbumType,
		"changeAlbumType",
		client,
		(newType: AlbumType) =>
			API.updateAlbum(a.id, { type: newType }).then((res) => {
				client.client.invalidateQueries("albums");
				return res;
			}),
		confirm,
	);

const ChangeVideoType = (
	v: Video,
	client: QueryClient,
	confirm: ReturnType<typeof useConfirm>,
) =>
	ChangeResourceType(
		v,
		VideoType,
		"changeVideoType",
		client,
		(newType: VideoType) =>
			API.updateVideo(v.id, { type: newType }).then((res) => {
				client.client.invalidateQueries("videos");
				return res;
			}),
		confirm,
	);

export { ChangeSongType, ChangeAlbumType, ChangeVideoType };
