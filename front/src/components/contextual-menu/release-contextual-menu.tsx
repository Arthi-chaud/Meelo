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

import { MasterIcon, UpgradeIcon } from "../icons";
import { toast } from "react-hot-toast";
import { useMutation } from "react-query";
import { useQueryClient } from "../../api/use-query";
import API from "../../api/api";
import ContextualMenu from "./contextual-menu";
import { GoToAlbumAction, GoToArtistAction } from "../actions/link";
import { useSelector } from "react-redux";
import type { RootState } from "../../state/store";
import { ShareReleaseAction } from "../actions/share";
import { DownloadReleaseAction } from "../actions/download";
import { useConfirm } from "material-ui-confirm";
import type { ReleaseWithRelations } from "../../models/release";
import { UpdateReleaseIllustrationAction } from "../actions/update-illustration";
import { ChangeAlbumType } from "../actions/resource-type";
import { RefreshReleaseMetadataAction } from "../actions/refresh-metadata";
import { useTranslation } from "react-i18next";

type ReleaseContextualMenuProps = {
	release: ReleaseWithRelations<"album">;
};

const ReleaseContextualMenu = (props: ReleaseContextualMenuProps) => {
	const userIsAdmin = useSelector(
		(state: RootState) => state.user.user?.admin == true,
	);
	const queryClient = useQueryClient();
	const confirm = useConfirm();
	const { t } = useTranslation();
	const masterMutation = useMutation(async () => {
		return API.updateAlbum(props.release.albumId, {
			masterReleaseId: props.release.id,
		})
			.then(() => {
				toast.success(t("releaseSetAsMaster"));
				queryClient.client.invalidateQueries();
			})
			.catch((error: Error) => toast.error(error.message));
	});
	const tracksMasterMutation = useMutation(async () => {
		const query = API.getReleaseTracklist(props.release.id);
		return queryClient
			.fetchQuery({
				key: query.key,
				exec: () => query.exec({ pageSize: 1000 }),
			})
			.then(({ items: tracks }) => {
				Promise.allSettled(
					tracks
						.reverse()
						.filter((track) => track.songId != null)
						.map((track) =>
							API.updateSong(track.songId!, {
								masterTrackId: track.id,
							}),
						),
				)
					.then(() => {
						toast.success(t("tracksUpdated"));
						queryClient.client.invalidateQueries();
					})
					.catch((error) => toast.error(error.message));
			});
	});

	return (
		<ContextualMenu
			actions={[
				[
					...(props.release.album.artistId
						? [GoToArtistAction(props.release.album.artistId)]
						: []),
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
					RefreshReleaseMetadataAction(props.release.id, t),
				],
				[DownloadReleaseAction(confirm, props.release.id, t)],
				[ShareReleaseAction(props.release.id, t)],
			]}
		/>
	);
};

export default ReleaseContextualMenu;
