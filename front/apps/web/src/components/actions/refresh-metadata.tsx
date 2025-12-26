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

import { Box, Button, Checkbox, Divider, Stack } from "@mui/material";
import { useState } from "react";
import toast from "react-hot-toast";
import type API from "@/api";
import { MetadataRefreshIcon } from "@/ui/icons";
import { useAPI, useQueryClient } from "~/api";
import type Action from "./";

type RefreshableResourceType =
	| Parameters<API["refreshLocalMetadata"]>[0]
	| "artist";

const RefreshMetadataActionContent = ({
	t,
	resourceType,
	resourceId,
	close,
}: {
	t: Translator;
	resourceType: RefreshableResourceType;
	resourceId: number;
	close: () => void;
}) => {
	const [force, setForce] = useState(false);
	const [reuseSources, setReuseSources] = useState(true);
	const api = useAPI();
	const canRefreshLocalMetadata = resourceType !== "artist";
	const canRefreshExternalMetadata = ["artist", "song", "album"].includes(
		resourceType,
	);
	const queryClient = useQueryClient();
	return (
		<Stack spacing={2} sx={{ padding: 2 }}>
			{canRefreshLocalMetadata && (
				<>
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						<Checkbox
							checked={force}
							onClick={() => setForce((f) => !f)}
						/>
						{t("tasks.refreshMetadataForm.forceLabel")}
					</Box>
					<Button
						fullWidth
						variant="contained"
						onClick={() => {
							api.refreshLocalMetadata(
								resourceType,
								resourceId,
								force,
							)
								.then(() =>
									toast.success(
										t("toasts.refreshMetadata.started"),
									),
								)
								.catch(() =>
									toast.error(
										t("toasts.refreshMetadata.failed"),
									),
								);
							close();
						}}
					>
						{t("tasks.refreshLocalMetadata")}
					</Button>
				</>
			)}
			{canRefreshLocalMetadata && canRefreshExternalMetadata && (
				<Divider />
			)}
			{canRefreshExternalMetadata && (
				<>
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						<Checkbox
							checked={reuseSources}
							onClick={() => setReuseSources((f) => !f)}
						/>
						{t("tasks.refreshMetadataForm.reuseLabel")}
					</Box>
					<Button
						fullWidth
						variant="contained"
						onClick={() => {
							toast
								.promise(
									api.refreshExternalMetadata(
										{
											[`${resourceType}Id`]: resourceId,
										},
										reuseSources,
									),
									{
										loading: t(
											"toasts.refreshMetadata.started",
										),
										success: "Metadata Refreshed!",
										error: t(
											"toasts.refreshMetadata.failed",
										),
									},
								)
								.then(async () => {
									await queryClient.client.invalidateQueries({
										queryKey: ["api", "external-metadata"],
									});
								});
							close();
						}}
					>
						{t("tasks.refreshExternalMetadata")}
					</Button>
				</>
			)}
		</Stack>
	);
};

const RefreshMetadataAction = (
	t: Translator,
	resourceType: RefreshableResourceType,
	resourceId: number,
): Action => ({
	label: "tasks.refreshMetadata",
	icon: <MetadataRefreshIcon />,
	dialog: ({ close }) => (
		<RefreshMetadataActionContent
			t={t}
			resourceId={resourceId}
			resourceType={resourceType}
			close={close}
		/>
	),
});

export const RefreshLibraryMetadataAction = (
	librarySlugOrId: number,
	t: Translator,
) => RefreshMetadataAction(t, "library", librarySlugOrId);

export const RefreshArtistMetadataAction = (
	artistSlugOrId: number,
	t: Translator,
) => RefreshMetadataAction(t, "artist", artistSlugOrId);

export const RefreshAlbumMetadataAction = (
	albumSlugOrId: number,
	t: Translator,
) => RefreshMetadataAction(t, "album", albumSlugOrId);

export const RefreshReleaseMetadataAction = (
	releaseSlugOrId: number,
	t: Translator,
) => RefreshMetadataAction(t, "release", releaseSlugOrId);

export const RefreshSongMetadataAction = (
	songSlugOrId: number,
	t: Translator,
) => RefreshMetadataAction(t, "song", songSlugOrId);

export const RefreshTrackMetadataAction = (
	trackSlugOrId: number,
	t: Translator,
) => RefreshMetadataAction(t, "track", trackSlugOrId);
