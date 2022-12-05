import { Star } from "@mui/icons-material";
import { toast } from "react-hot-toast";
import { useMutation, useQueryClient } from "react-query";
import { useSelector } from "react-redux";
import API from "../../api/api";
import { TrackWithSong } from "../../models/track";
import { RootState } from "../../state/store";
import ContextualMenu from "./contextual-menu";
import { useConfirm } from "material-ui-confirm";
import { DownloadAction } from "../actions/download";
import { GoToReleaseAction } from "../actions/link";
import { PlayAfterAction, PlayNextAction } from "../actions/playlist";
import { ShowTrackFileInfoAction } from "../actions/show-track-info";

type TrackContextualMenuProps = {
	track: TrackWithSong;
	onSelect?: () => void;
}

const TrackContextualMenu = (props: TrackContextualMenuProps) => {
	const userIsAdmin = useSelector((state: RootState) => state.user.user?.admin == true);
	const queryClient = useQueryClient();
	const confirm = useConfirm();
	const getPlayNextProps = () => API.getArtist(props.track.song.artistId)
		.then((artist) => API.getRelease(props.track.releaseId)
			.then((release) => ({ track: props.track, artist, release })));
	const masterMutation = useMutation(async () => {
		return API.setTrackAsMaster(props.track.id)
			.then(() => {
				toast.success("Track set as master!");
				queryClient.invalidateQueries();
			})
			.catch((error: Error) => toast.error(error.message));
	});

	return <ContextualMenu onSelect={props.onSelect} actions={[
		[GoToReleaseAction(props.track.releaseId)],
		[PlayNextAction(getPlayNextProps), PlayAfterAction(getPlayNextProps)],
		[
			{
				label: "Set as as Master",
				disabled: props.track.master || !userIsAdmin,
				icon: <Star/>,
				onClick: () => masterMutation.mutate()
			}
		],
		[ShowTrackFileInfoAction(confirm, props.track.id)],
		[DownloadAction(confirm, props.track.stream)]
	]}/>;
};

export default TrackContextualMenu;
