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

import type { useConfirm } from "material-ui-confirm";
import type API from "@/api";
import { ArchiveIcon, DownloadIcon } from "@/ui/icons";
import type Action from "./";

const confirmDownloadAction = (
	confirm: ReturnType<typeof useConfirm>,
	downloadUrl: string,
	t: Translator,
) => {
	confirm({
		title: t("actions.warningModalTitle"),
		description: t("actions.download.warning"),
		confirmationText: t("actions.download.label"),
		confirmationButtonProps: {
			color: "error",
			variant: "outlined",
			href: downloadUrl,
		},
	});
};

export const DownloadAction = (
	api: API,
	confirm: ReturnType<typeof useConfirm>,
	sourceFileId: number,
	t: Translator,
): Action => ({
	icon: <DownloadIcon />,
	label: "actions.download.label",
	onClick: () =>
		confirmDownloadAction(confirm, api.getDirectStreamURL(sourceFileId), t),
});

export const DownloadAsyncAction = (
	api: API,
	confirm: ReturnType<typeof useConfirm>,
	sourceFileId: () => PromiseLike<number>,
	t: Translator,
): Action => ({
	icon: <DownloadIcon />,
	label: "actions.download.label",
	onClick: () =>
		sourceFileId().then((id) =>
			confirmDownloadAction(confirm, api.getDirectStreamURL(id), t),
		),
});

export const DownloadReleaseAction = (
	api: API,
	confirm: ReturnType<typeof useConfirm>,
	releaseId: number | string,
	t: Translator,
): Action => ({
	icon: <ArchiveIcon />,
	label: "actions.archive",
	onClick: () =>
		confirmDownloadAction(confirm, api.getReleaseArchiveURL(releaseId), t),
});

export const DownloadReleaseAsyncAction = (
	api: API,
	confirm: ReturnType<typeof useConfirm>,
	releaseId: () => PromiseLike<number | string>,
	t: Translator,
): Action => ({
	icon: <ArchiveIcon />,
	label: "actions.archive",
	onClick: () =>
		releaseId().then((id) =>
			confirmDownloadAction(confirm, api.getReleaseArchiveURL(id), t),
		),
});
