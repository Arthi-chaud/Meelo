import { Info } from "@mui/icons-material";
import Action from "./action";
import { useConfirm } from "material-ui-confirm";
import API from "../../api/api";
import { openTrackFileInfoModal } from "../track-file-info";

export const ShowTrackFileInfoAction = (
	confirm: ReturnType<typeof useConfirm>, trackId: number
): Action => ({
	icon: <Info/>,
	label: "More Info",
	onClick: () => openTrackFileInfoModal(confirm, trackId)
});

export const ShowMasterTrackFileInfoAction = (
	confirm: ReturnType<typeof useConfirm>, songId: number
): Action => ({
	icon: <Info/>,
	label: "More Info",
	onClick: () => API.getMasterTrack(songId)
		.exec()
		.then((track) => openTrackFileInfoModal(confirm, track.id))
});
