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

import type { QueryClient } from "@/api/hook";
import type Album from "@/models/album";
import { AlbumType } from "@/models/album";
import type Song from "@/models/song";
import { SongType } from "@/models/song";
import {
	albumTypeToTranslationKey,
	songTypeToTranslationKey,
	videoTypeToTranslationKey,
} from "@/models/utils";
import type Video from "@/models/video";
import { VideoType } from "@/models/video";
import { store } from "@/state/store";
import { EditIcon } from "@/ui/icons";
import { Chip, Grid } from "@mui/material";
import type { useConfirm } from "material-ui-confirm";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { userAtom } from "~/state/user";
import type Action from "./";

const ResourceTypeForm = <Enum extends string>(props: {
	defaultValue?: Enum;
	values: readonly Enum[];
	translate: (s: Enum) => TranslationKey;
	onSelect: (type: Enum) => void;
}) => {
	const [currentType, setType] = useState(props.defaultValue);
	const { t } = useTranslation();

	return (
		<>
			<Grid container spacing={2} justifyContent="center">
				{props.values.map((type) => (
					<Grid key={type}>
						<Chip
							label={t(props.translate(type))}
							variant={
								type === currentType ? "filled" : "outlined"
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
	TypeEnum extends string,
>(
	resource: T,
	types: readonly TypeEnum[],
	translateType: (s: TypeEnum) => TranslationKey,
	label: TranslationKey,
	queryClient: QueryClient,
	onSelect: (newType: TypeEnum) => Promise<void>,
	confirm: ReturnType<typeof useConfirm>,
): Action => {
	return {
		label: label,
		icon: <EditIcon />,
		disabled: store.get(userAtom)?.admin !== true,
		onClick: () =>
			confirm({
				title: <br />,
				description: (
					<ResourceTypeForm
						defaultValue={resource.type}
						values={types}
						translate={translateType}
						onSelect={(type) =>
							toast
								.promise(onSelect(type), {
									loading: "Updating...",
									success: "Update successful!",
									error: "Update failed...",
								})
								.then(() => {
									queryClient.client.invalidateQueries({
										queryKey: ["songs"],
									});
									queryClient.client.invalidateQueries({
										queryKey: ["release"],
									});
									queryClient.client.invalidateQueries({
										queryKey: ["tracks"],
									});
									queryClient.client.invalidateQueries({
										queryKey: ["videos"],
									});
									queryClient.client.invalidateQueries({
										queryKey: ["bsides"],
									});
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
		SongType.filter((t) => t !== "Unknown"),
		(type) => songTypeToTranslationKey(type, false),
		"actions.song.changeType",
		client,
		(newType: SongType) =>
			client.api.updateSong(s.id, { type: newType }).then((res) => {
				client.client.invalidateQueries({ queryKey: ["songs"] });
				client.client.invalidateQueries({ queryKey: ["release"] });
				client.client.invalidateQueries({ queryKey: ["tracks"] });
				client.client.invalidateQueries({ queryKey: ["videos"] });
				client.client.invalidateQueries({ queryKey: ["bsides"] });
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
		(type) => albumTypeToTranslationKey(type, false),
		"actions.album.changeType",
		client,
		(newType: AlbumType) =>
			client.api.updateAlbum(a.id, { type: newType }).then((res) => {
				client.client.invalidateQueries({ queryKey: ["albums"] });
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
		(type) => videoTypeToTranslationKey(type, false),
		"actions.video.changeType",
		client,
		(newType: VideoType) =>
			client.api.updateVideo(v.id, { type: newType }).then((res) => {
				client.client.invalidateQueries({ queryKey: ["videos"] });
				return res;
			}),
		confirm,
	);

export { ChangeSongType, ChangeAlbumType, ChangeVideoType };
