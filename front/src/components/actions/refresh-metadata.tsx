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

import { Button, Checkbox, Grid } from "@mui/material";
import { useState } from "react";
import toast from "react-hot-toast";
import type { ArraySlice } from "type-fest";
import API from "~/api";
import { MetadataRefreshIcon } from "~/components/icons";
import type { Translator } from "~/i18n/i18n";
import type Action from "./";

type APIMethodParams = ArraySlice<
	Parameters<typeof API.refreshMetadata>,
	0,
	-1
>;

const RefreshMetadataActionContent = ({
	t,
	params,
	close,
}: { t: Translator; params: APIMethodParams; close: () => void }) => {
	const [force, setForce] = useState(false);

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
				<Checkbox
					checked={force}
					onChange={(_, isChecked) => setForce(isChecked)}
				/>
				{t("refreshMetadataForceLabel")}
			</Grid>
			<Grid size={{ xs: 12 }}>
				<Button
					fullWidth
					variant="contained"
					onClick={() => {
						API.refreshMetadata(...[...params, force])
							.then(() =>
								toast.success(t("refreshMetadataStarted")),
							)
							.catch(() =>
								toast.error(t("refreshMetadataFailed")),
							);
						close();
					}}
				>
					{t("refreshMetadata")}
				</Button>
			</Grid>
		</Grid>
	);
};

const RefreshMetadataAction = (
	t: Translator,
	...params: APIMethodParams
): Action => ({
	label: "refreshMetadata",
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
