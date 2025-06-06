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

import type API from "@/api";
import { useAPI } from "@/api/hook";
import { MetadataRefreshIcon } from "@/ui/icons";
import { Button, Checkbox, Grid } from "@mui/material";
import { useState } from "react";
import toast from "react-hot-toast";
import type { ArraySlice } from "type-fest";
import type Action from "./";

type APIMethodParams = ArraySlice<Parameters<API["refreshMetadata"]>, 0, -1>;

const RefreshMetadataActionContent = ({
	t,
	params,
	close,
}: { t: Translator; params: APIMethodParams; close: () => void }) => {
	const [force, setForce] = useState(false);
	const api = useAPI();

	return (
		<Grid container spacing={2} sx={{ padding: 2 }}>
			<Grid
				size={{ xs: 12 }}
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<Checkbox checked={force} onClick={() => setForce((f) => !f)} />
				{t("tasks.refreshMetadataForm.forceLabel")}
			</Grid>
			<Grid size={{ xs: 12 }}>
				<Button
					fullWidth
					variant="contained"
					onClick={() => {
						api.refreshMetadata(...[...params, force])
							.then(() =>
								toast.success(
									t("toasts.refreshMetadata.started"),
								),
							)
							.catch(() =>
								toast.error(t("toasts.refreshMetadata.failed")),
							);
						close();
					}}
				>
					{t("tasks.refreshMetadata")}
				</Button>
			</Grid>
		</Grid>
	);
};

const RefreshMetadataAction = (
	t: Translator,
	...params: APIMethodParams
): Action => ({
	label: "tasks.refreshMetadata",
	icon: <MetadataRefreshIcon />,
	dialog: ({ close }) => (
		<RefreshMetadataActionContent t={t} params={params} close={close} />
	),
});

export const RefreshLibraryMetadataAction = (
	librarySlugOrId: number | string,
	t: Translator,
) => RefreshMetadataAction(t, "library", librarySlugOrId);

export const RefreshAlbumMetadataAction = (
	albumSlugOrId: number | string,
	t: Translator,
) => RefreshMetadataAction(t, "album", albumSlugOrId);

export const RefreshReleaseMetadataAction = (
	releaseSlugOrId: number | string,
	t: Translator,
) => RefreshMetadataAction(t, "release", releaseSlugOrId);

export const RefreshSongMetadataAction = (
	songSlugOrId: number | string,
	t: Translator,
) => RefreshMetadataAction(t, "song", songSlugOrId);

export const RefreshTrackMetadataAction = (
	trackSlugOrId: number | string,
	t: Translator,
) => RefreshMetadataAction(t, "track", trackSlugOrId);
