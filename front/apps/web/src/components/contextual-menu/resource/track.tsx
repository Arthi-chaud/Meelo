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
import { getArtist } from "@/api/queries";
import type { TrackWithRelations } from "@/models/track";
import { MasterIcon } from "@/ui/icons";
import { useQueryClient } from "~/api";
import type Action from "~/components/actions";
import { DownloadAction } from "~/components/actions/download";
import {
	GoToReleaseAction,
	GoToSongInfoAction,
	GoToSongLyricsAction,
} from "~/components/actions/link";
import { ReassignTrackAction } from "~/components/actions/merge";
import {
	AddToPlaylistAction,
	PlayAfterAction,
	PlayNextAction,
} from "~/components/actions/playlist";
import { RefreshTrackMetadataAction } from "~/components/actions/refresh-metadata";
import { ChangeSongType } from "~/components/actions/resource-type";
import { ShowTrackFileInfoAction } from "~/components/actions/show-track-info";
import { UpdateTrackIllustrationAction } from "~/components/actions/update-illustration";
import { userAtom } from "~/state/user";
import { ContextualMenu } from "..";

type TrackContextualMenuProps = {
	track: TrackWithRelations<"video" | "song" | "illustration">;
	onSelect?: () => void;
};

const TrackContextualMenu = (props: TrackContextualMenuProps) => {
	const [user] = useAtom(userAtom);
	const userIsAdmin = user?.admin === true;
	const queryClient = useQueryClient();
	const confirm = useConfirm();
	const isMaster = props.track.song?.masterId === props.track.id;
	const getPlayNextProps = () =>
		queryClient
			.fetchQuery(
				getArtist((props.track.song ?? props.track.video)!.artistId),
			)
			.then((artist) => ({
				track: props.track,
				artist,
				featuring: undefined,
			}));
	const { t } = useTranslation();
	const masterMutation = useMutation({
		mutationFn: async () => {
			return queryClient.api
				.updateSong(props.track.songId!, {
					masterTrackId: props.track.id,
				})
				.then(() => {
					toast.success(t("toasts.trackSetAsMaster"));
					queryClient.client.invalidateQueries();
				})
				.catch((error: Error) => toast.error(error.message));
		},
	});

	return (
		<ContextualMenu
			onSelect={props.onSelect}
			actions={[
				[
					props.track.releaseId
						? GoToReleaseAction(props.track.releaseId)
						: undefined,
				].filter((a): a is Action => a !== undefined),
				props.track.song
					? [
							GoToSongLyricsAction(props.track.song.slug),
							GoToSongInfoAction(props.track.song.slug),
						]
					: [],
				[
					PlayNextAction(getPlayNextProps),
					PlayAfterAction(getPlayNextProps),
				],
				props.track.songId
					? [
							AddToPlaylistAction(
								{ songId: props.track.songId },
								queryClient,
							),
						]
					: [],
				props.track.songId
					? [
							{
								label: "actions.setAsMaster",
								disabled: isMaster || !userIsAdmin,
								icon: <MasterIcon />,
								onClick: () => masterMutation.mutate(),
							},
						]
					: [],
				[
					...(props.track.song
						? [ChangeSongType(props.track.song, queryClient)]
						: []),
					UpdateTrackIllustrationAction(queryClient, props.track.id),
					RefreshTrackMetadataAction(props.track.id, t),
					...(props.track.song !== null && props.track.songId !== null
						? [ReassignTrackAction(props.track as any, queryClient)]
						: []),
				],
				[ShowTrackFileInfoAction(confirm, props.track.id)],
				[
					DownloadAction(
						queryClient.api,
						confirm,
						props.track.sourceFileId,
						t,
					),
				],
			]}
		/>
	);
};

export default TrackContextualMenu;
