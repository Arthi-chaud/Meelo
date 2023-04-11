import { Star, SwitchAccessShortcut } from "@mui/icons-material";
import { toast } from "react-hot-toast";
import { useMutation } from "react-query";
import { useQueryClient } from "../../api/use-query";
import API from "../../api/api";
import ContextualMenu from "./contextual-menu";
import { GoToAlbumAction, GoToArtistAction } from "../actions/link";
import { useSelector } from "react-redux";
import { RootState } from "../../state/store";
import { ShareReleaseAction } from "../actions/share";
import { DownloadReleaseAction } from "../actions/download";
import { useConfirm } from "material-ui-confirm";
import { ReleaseWithRelations } from "../../models/release";
import { UpdateReleaseIllustrationAction } from "../actions/update-illustration";

type ReleaseContextualMenuProps = {
	release: ReleaseWithRelations<'album'>;
}

const ReleaseContextualMenu = (props: ReleaseContextualMenuProps) => {
	const userIsAdmin = useSelector((state: RootState) => state.user.user?.admin == true);
	const queryClient = useQueryClient();
	const confirm = useConfirm();
	const masterMutation = useMutation(async () => {
		return API.setReleaseAsMaster(props.release.id)
			.then(() => {
				toast.success("Release set as master!");
				queryClient.client.invalidateQueries();
			})
			.catch((error: Error) => toast.error(error.message));
	});
	const tracksMasterMutation = useMutation(async () => {
		return queryClient.fetchQuery(API.getReleasePlaylist(props.release.id))
			.then((tracks) => {
				Promise.allSettled(
					tracks.reverse().map((track) =>	API.setTrackAsMaster(track.id))
				).then(() => {
					toast.success("Tracks successfully updated");
					queryClient.client.invalidateQueries();
				}).catch((error) => toast.error(error.message));
			});
	});

	return <ContextualMenu actions={[
		[
			...props.release.album.artistId ? [GoToArtistAction(props.release.album.artistId)] : [],
			GoToAlbumAction(props.release.album.id),
			{
				label: "Set as Master",
				disabled: props.release.id == props.release.album.masterId || !userIsAdmin,
				icon: <Star/>,
				onClick: () => masterMutation.mutate()
			},
			{
				label: "Set all tracks as Master",
				icon: <SwitchAccessShortcut/>,
				disabled: !userIsAdmin,
				onClick: () => tracksMasterMutation.mutate()
			},
		],
		[UpdateReleaseIllustrationAction(confirm, queryClient, props.release.id)],
		[DownloadReleaseAction(confirm, props.release.id)],
		[ShareReleaseAction(props.release.id)]
	]}/>;
};

export default ReleaseContextualMenu;
