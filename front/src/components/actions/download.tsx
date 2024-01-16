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

import Action from "./action";
import { useConfirm } from "material-ui-confirm";
import API from "../../api/api";
import confirmDownloadAction from "../confirm-download-action";
import { ArchiveIcon, DownloadIcon } from "../icons";
import { Translator } from "../../i18n/i18n";

export const DownloadAction = (
	confirm: ReturnType<typeof useConfirm>,
	streamURL: string,
	t: Translator,
): Action => ({
	icon: <DownloadIcon />,
	label: "download",
	onClick: () =>
		confirmDownloadAction(confirm, API.getStreamURL(streamURL), t),
});

export const DownloadAsyncAction = (
	confirm: ReturnType<typeof useConfirm>,
	streamURL: () => PromiseLike<string>,
	t: Translator,
): Action => ({
	icon: <DownloadIcon />,
	label: "download",
	onClick: () =>
		streamURL().then((url) =>
			confirmDownloadAction(confirm, API.getStreamURL(url), t),
		),
});

export const DownloadReleaseAction = (
	confirm: ReturnType<typeof useConfirm>,
	releaseId: number | string,
	t: Translator,
): Action => ({
	icon: <ArchiveIcon />,
	label: "archive",
	onClick: () =>
		confirmDownloadAction(confirm, API.getReleaseArchiveURL(releaseId), t),
});

export const DownloadReleaseAsyncAction = (
	confirm: ReturnType<typeof useConfirm>,
	releaseId: () => PromiseLike<number | string>,
	t: Translator,
): Action => ({
	icon: <ArchiveIcon />,
	label: "archive",
	onClick: () =>
		releaseId().then((id) =>
			confirmDownloadAction(confirm, API.getReleaseArchiveURL(id), t),
		),
});
