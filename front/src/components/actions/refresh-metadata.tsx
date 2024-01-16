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

import { MetadataRefreshIcon } from "../icons";
import API from "../../api/api";
import Action from "./action";
import toast from "react-hot-toast";
import { Translator } from "../../i18n/i18n";

const RefreshMetadataAction = (
	t: Translator,
	...params: Parameters<typeof API.refreshMetadata>
): Action => ({
	label: "refreshMetadata",
	icon: <MetadataRefreshIcon />,
	onClick: () =>
		API.refreshMetadata(...params)
			.then(() => toast.success(t("refreshMetadataStarted")))
			.catch(() => toast.error(t("refreshMetadataFailed"))),
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
