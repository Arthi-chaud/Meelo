import { Info } from "@mui/icons-material";
import Action from "./action";
import { useConfirm } from "material-ui-confirm";
import API from "../../api/api";
import { openTrackFileInfoModal } from "../track-file-info";
import { QueryClient } from "../../api/use-query";

export const ShowTrackFileInfoAction = (
	confirm: ReturnType<typeof useConfirm>, trackId: number
): Action => ({
	icon: <Info/>,
	label: "More Info",
	onClick: () => openTrackFileInfoModal(confirm, trackId)
});

export const ShowMasterTrackFileInfoAction = (
	confirm: ReturnType<typeof useConfirm>, queryClient: QueryClient, songId: number
): Action => ({
	icon: <Info/>,
	label: "More Info",
	onClick: () => queryClient.fetchQuery(API.getMasterTrack(songId))
		.then((track) => openTrackFileInfoModal(confirm, track.id))
});
