import { MasterIcon, UpgradeIcon } from "../icons";
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
import { translate } from "../../i18n/translate";
import ChangeAlbumType from "../actions/album-type";
import { RefreshReleaseMetadataAction } from "../actions/refresh-metadata";

type ReleaseContextualMenuProps = {
	release: ReleaseWithRelations<"album">;
};

const ReleaseContextualMenu = (props: ReleaseContextualMenuProps) => {
	const userIsAdmin = useSelector(
		(state: RootState) => state.user.user?.admin == true,
	);
	const queryClient = useQueryClient();
	const confirm = useConfirm();
	const masterMutation = useMutation(async () => {
		return API.setReleaseAsMaster(props.release.id)
			.then(() => {
				toast.success(translate("releaseSetAsMaster"));
				queryClient.client.invalidateQueries();
			})
			.catch((error: Error) => toast.error(error.message));
	});
	const tracksMasterMutation = useMutation(async () => {
		return queryClient
			.fetchQuery(API.getReleasePlaylist(props.release.id))
			.then((tracks) => {
				Promise.allSettled(
					tracks
						.reverse()
						.map((track) => API.setTrackAsMaster(track.id)),
				)
					.then(() => {
						toast.success(translate("tracksUpdated"));
						queryClient.client.invalidateQueries();
					})
					.catch((error) => toast.error(error.message));
			});
	});

	return (
		<ContextualMenu
			actions={[
				[
					...(props.release.album.artistId ?
						[GoToArtistAction(props.release.album.artistId)]
					:	[]),
					GoToAlbumAction(props.release.album.id),
					{
						label: "setAsMaster",
						disabled:
							props.release.id == props.release.album.masterId ||
							!userIsAdmin,
						icon: <MasterIcon />,
						onClick: () => masterMutation.mutate(),
					},
					{
						label: "setAllTracksAsMaster",
						icon: <UpgradeIcon />,
						disabled: !userIsAdmin,
						onClick: () => tracksMasterMutation.mutate(),
					},
				],
				[
					ChangeAlbumType(props.release.album, queryClient, confirm),
					UpdateReleaseIllustrationAction(
						queryClient,
						props.release.id,
					),
					RefreshReleaseMetadataAction(props.release.id),
				],
				[DownloadReleaseAction(confirm, props.release.id)],
				[ShareReleaseAction(props.release.id)],
			]}
		/>
	);
};

export default ReleaseContextualMenu;
