import { Download } from "@mui/icons-material";
import Action from "./action";
import { useConfirm } from "material-ui-confirm";
import API from "../../api/api";
import confirmDownloadAction from "../confirm-download-action";

export const DownloadAction = (
	confirm: ReturnType<typeof useConfirm>, streamURL: string
): Action => ({
	icon: <Download/>,
	label: "Download",
	onClick: () => confirmDownloadAction(confirm, API.getStreamURL(streamURL))
});

export const DownloadAsyncAction = (
	confirm: ReturnType<typeof useConfirm>, streamURL: () => PromiseLike<string>
): Action => ({
	icon: <Download/>,
	label: "Download",
	onClick: () => streamURL()
		.then((url) => confirmDownloadAction(
			confirm,
			API.getStreamURL(url)
		))
});
