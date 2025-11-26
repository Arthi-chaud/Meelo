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

import { useMutation } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useConfirm } from "material-ui-confirm";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { getReleaseTracklist } from "@/api/queries";
import type { ReleaseWithRelations } from "@/models/release";
import { MasterIcon, UpgradeIcon } from "@/ui/icons";
import { useQueryClient } from "~/api";
import { DownloadReleaseAction } from "~/components/actions/download";
import { GoToAlbumAction, GoToArtistAction } from "~/components/actions/link";
import { PlayReleaseAction } from "~/components/actions/play-album";
import { AddToPlaylistAction } from "~/components/actions/playlist";
import { RefreshReleaseMetadataAction } from "~/components/actions/refresh-metadata";
import { ChangeAlbumType } from "~/components/actions/resource-type";
import { ShareReleaseAction } from "~/components/actions/share";
import { UpdateReleaseIllustrationAction } from "~/components/actions/update-illustration";
import { userAtom } from "~/state/user";
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
	const masterMutation = useMutation({
		mutationFn: async () => {
			return queryClient.api
				.updateAlbum(props.release.albumId, {
					masterReleaseId: props.release.id,
				})
				.then(() => {
					toast.success(t("toasts.releaseSetAsMaster"));
					queryClient.client.invalidateQueries();
				})
				.catch((error: Error) => toast.error(error.message));
		},
	});
	const tracksMasterMutation = useMutation({
		mutationFn: async () => {
			const query = getReleaseTracklist(props.release.id);
			return queryClient
				.fetchQuery({
					key: query.key,
					exec: (api_) => () => query.exec(api_)({ pageSize: 1000 }),
				})
				.then(({ items: tracks }) => {
					Promise.allSettled(
						tracks
							.reverse()
							.filter((track) => track.songId != null)
							.map((track) =>
								queryClient.api.updateSong(track.songId!, {
									masterTrackId: track.id,
								}),
							),
					)
						.then(() => {
							toast.success(t("toasts.tracksUpdated"));
							queryClient.client.invalidateQueries();
						})
						.catch((error) => toast.error(error.message));
				});
		},
	});

	return (
		<ContextualMenu
			actions={[
				[PlayReleaseAction(props.release.id, queryClient)],
				[
					...(props.release.album.artistId
						? [GoToArtistAction(props.release.album.artistId)]
						: []),
					GoToAlbumAction(props.release.album.id),
				],
				[
					AddToPlaylistAction(
						{ releaseId: props.release.id },
						queryClient,
					),
				],
				[
					{
						label: "actions.setAsMaster",
						disabled:
							props.release.id === props.release.album.masterId ||
							!userIsAdmin,
						icon: <MasterIcon />,
						onClick: () => masterMutation.mutate(),
					},
					{
						label: "actions.release.setAllTracksAsMaster",
						icon: <UpgradeIcon />,
						disabled: !userIsAdmin,
						onClick: () => tracksMasterMutation.mutate(),
					},
				],

				[
					ChangeAlbumType(props.release.album, queryClient),
					UpdateReleaseIllustrationAction(
						queryClient,
						props.release.id,
					),
					RefreshReleaseMetadataAction(props.release.id, t),
				],
				[
					DownloadReleaseAction(
						queryClient.api,
						confirm,
						props.release.id,
						t,
					),
				],
				[ShareReleaseAction(props.release.id, t)],
			]}
		/>
	);
};

export default ReleaseContextualMenu;
