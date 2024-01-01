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

import { MasterIcon } from "../icons";
import { toast } from "react-hot-toast";
import { useMutation } from "react-query";
import { useQueryClient } from "../../api/use-query";
import { useSelector } from "react-redux";
import API from "../../api/api";
import { RootState } from "../../state/store";
import ContextualMenu from "./contextual-menu";
import { useConfirm } from "material-ui-confirm";
import { DownloadAction } from "../actions/download";
import { GoToReleaseAction } from "../actions/link";
import {
	AddToPlaylistAction,
	PlayAfterAction,
	PlayNextAction,
} from "../actions/playlist";
import { ShowTrackFileInfoAction } from "../actions/show-track-info";
import { TrackWithRelations } from "../../models/track";
import { UpdateTrackIllustrationAction } from "../actions/update-illustration";
import { translate } from "../../i18n/translate";
import { RefreshTrackMetadataAction } from "../actions/refresh-metadata";
import ChangeSongType from "../actions/song-type";

type TrackContextualMenuProps = {
	track: TrackWithRelations<"songVersion">;
	onSelect?: () => void;
};

const TrackContextualMenu = (props: TrackContextualMenuProps) => {
	const userIsAdmin = useSelector(
		(state: RootState) => state.user.user?.admin == true,
	);
	const queryClient = useQueryClient();
	const confirm = useConfirm();
	const isMaster = props.track.songVersion.masterId == props.track.id;
	const getPlayNextProps = () =>
		queryClient
			.fetchQuery(API.getSong(props.track.songVersion.songId, ["artist"]))
			.then(({ artist }) => ({
				track: props.track,
				artist,
			}));
	const masterMutation = useMutation(async () => {
		return API.setTrackAsMaster(props.track.id)
			.then(() => {
				toast.success(translate("trackSetAsMaster"));
				queryClient.client.invalidateQueries();
			})
			.catch((error: Error) => toast.error(error.message));
	});

	return (
		<ContextualMenu
			onSelect={props.onSelect}
			actions={[
				[GoToReleaseAction(props.track.releaseId)],
				[
					PlayNextAction(getPlayNextProps),
					PlayAfterAction(getPlayNextProps),
				],
				[AddToPlaylistAction(props.track.songVersionId, queryClient)],
				[
					{
						label: "setAsMaster",
						disabled: isMaster || !userIsAdmin,
						icon: <MasterIcon />,
						onClick: () => masterMutation.mutate(),
					},
				],
				[
					ChangeSongType(
						props.track.songVersion,
						queryClient,
						confirm,
					),
					UpdateTrackIllustrationAction(queryClient, props.track.id),
					RefreshTrackMetadataAction(props.track.id),
				],
				[ShowTrackFileInfoAction(confirm, props.track.id)],
				[DownloadAction(confirm, props.track.stream)],
			]}
		/>
	);
};

export default TrackContextualMenu;
