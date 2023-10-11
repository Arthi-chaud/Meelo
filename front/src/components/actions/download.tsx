import Action from "./action";
import { useConfirm } from "material-ui-confirm";
import API from "../../api/api";
import confirmDownloadAction from "../confirm-download-action";
import { ArchiveIcon, DownloadIcon } from "../icons";

export const DownloadAction = (
	confirm: ReturnType<typeof useConfirm>, streamURL: string
): Action => ({
	icon: <DownloadIcon />,
	label: "download",
	onClick: () => confirmDownloadAction(confirm, API.getStreamURL(streamURL))
});

export const DownloadAsyncAction = (
	confirm: ReturnType<typeof useConfirm>, streamURL: () => PromiseLike<string>
): Action => ({
	icon: <DownloadIcon />,
	label: "download",
	onClick: () => streamURL()
		.then((url) => confirmDownloadAction(
			confirm,
			API.getStreamURL(url)
		))
});

export const DownloadReleaseAction = (
	confirm: ReturnType<typeof useConfirm>, releaseId: number | string
): Action => ({
	icon: <ArchiveIcon />,
	label: "archive",
	onClick: () => confirmDownloadAction(confirm, API.getReleaseArchiveURL(releaseId))
});

export const DownloadReleaseAsyncAction = (
	confirm: ReturnType<typeof useConfirm>, releaseId: () => PromiseLike<number | string>
): Action => ({
	icon: <ArchiveIcon />,
	label: "archive",
	onClick: () => releaseId()
		.then((id) => confirmDownloadAction(
			confirm,
			API.getReleaseArchiveURL(id)
		))
});
