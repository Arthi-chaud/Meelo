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

import { useAtom } from "jotai";
import { useConfirm } from "material-ui-confirm";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import API from "api/api";
import { useQueryClient } from "api/use-query";
import type { ReleaseWithRelations } from "models/release";
import { userAtom } from "state/user";
import { DownloadReleaseAction } from "components/actions/download";
import { GoToAlbumAction, GoToArtistAction } from "components/actions/link";
import { RefreshReleaseMetadataAction } from "components/actions/refresh-metadata";
import { ChangeAlbumType } from "components/actions/resource-type";
import { ShareReleaseAction } from "components/actions/share";
import { UpdateReleaseIllustrationAction } from "components/actions/update-illustration";
import { MasterIcon, UpgradeIcon } from "components/icons";
import { ContextualMenu } from "..";

type ReleaseContextualMenuProps = {
	release: ReleaseWithRelations<"album">;
};

const ReleaseContextualMenu = (props: ReleaseContextualMenuProps) => {
	const [user] = useAtom(userAtom);
	const userIsAdmin = user?.admin === true;
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
							props.release.id === props.release.album.masterId ||
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
