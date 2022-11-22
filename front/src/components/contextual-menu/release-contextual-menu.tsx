import { Star } from "@mui/icons-material";
import { toast } from "react-hot-toast";
import { useMutation, useQueryClient } from "react-query";
import API from "../../api/api";
import { ReleaseWithAlbum } from "../../models/release";
import ContextualMenu from "./contextual-menu";
import {
	GoToAlbumAction, GoToArtistAction, ShareReleaseAction
} from "./actions";

type ReleaseContextualMenuProps = {
	release: ReleaseWithAlbum;
}

const ReleaseContextualMenu = (props: ReleaseContextualMenuProps) => {
	const queryClient = useQueryClient();
	const masterMutation = useMutation(async () => {
		return API.setReleaseAsMaster(props.release.id)
			.then(() => {
				toast.success("Release set as master!");
				queryClient.invalidateQueries();
			})
			.catch((error: Error) => toast.error(error.message));
	});
	const tracksMasterMutation = useMutation(async () => {
		return API.getReleasePlaylist(props.release.id)
			.then((tracks) => {
				Promise.allSettled(
					tracks.reverse().map((track) =>	API.setTrackAsMaster(track.id))
				).then(() => {
					toast.success("Tracks successfully updated");
					queryClient.invalidateQueries();
				}).catch((error) => toast.error(error.message));
			});
	});

	return <ContextualMenu actions={[
		[
			...props.release.album.artistId ? [GoToArtistAction(props.release.album.artistId)] : [],
			GoToAlbumAction(props.release.album.id),
			{
				label: "Set as Master",
				disabled: props.release.master,
				icon: <Star/>,
				onClick: () => masterMutation.mutate()
			},
			{
				label: "Set all tracks as Master",
				icon: <Star/>,
				onClick: () => tracksMasterMutation.mutate()
			},
			ShareReleaseAction(props.release.id)
		]
	]}/>;
};

export default ReleaseContextualMenu;
