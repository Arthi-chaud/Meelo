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
import API from "~/api";
import { useQueryClient } from "~/api/use-query";
import type Action from "~/components/actions";
import { DownloadAction } from "~/components/actions/download";
import {
	GoToReleaseAction,
	GoToSongInfoAction,
	GoToSongLyricsAction,
} from "~/components/actions/link";
import {
	AddToPlaylistAction,
	PlayAfterAction,
	PlayNextAction,
} from "~/components/actions/playlist";
import { RefreshTrackMetadataAction } from "~/components/actions/refresh-metadata";
import { ChangeSongType } from "~/components/actions/resource-type";
import { ShowTrackFileInfoAction } from "~/components/actions/show-track-info";
import { UpdateTrackIllustrationAction } from "~/components/actions/update-illustration";
import { MasterIcon } from "~/components/icons";
import type { TrackWithRelations } from "~/models/track";
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
		Promise.all([
			queryClient.fetchQuery(
				API.getArtist(
					(props.track.song ?? props.track.video)!.artistId,
				),
			),
			props.track.releaseId &&
				queryClient.fetchQuery(API.getRelease(props.track.releaseId)),
		]).then(([artist, release]) => ({
			track: props.track,
			artist,
			release,
		}));
	const { t } = useTranslation();
	const masterMutation = useMutation(async () => {
		return API.updateSong(props.track.songId!, {
			masterTrackId: props.track.id,
		})
			.then(() => {
				toast.success(t("trackSetAsMaster"));
				queryClient.client.invalidateQueries();
			})
			.catch((error: Error) => toast.error(error.message));
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
					? [AddToPlaylistAction(props.track.songId, queryClient)]
					: [],
				props.track.songId
					? [
							{
								label: "setAsMaster",
								disabled: isMaster || !userIsAdmin,
								icon: <MasterIcon />,
								onClick: () => masterMutation.mutate(),
							},
						]
					: [],
				[
					...(props.track.song
						? [
								ChangeSongType(
									props.track.song,
									queryClient,
									confirm,
								),
							]
						: []),
					UpdateTrackIllustrationAction(queryClient, props.track.id),
					RefreshTrackMetadataAction(props.track.id, t),
				],
				[ShowTrackFileInfoAction(confirm, props.track.id)],
				[DownloadAction(confirm, props.track.sourceFileId, t)],
			]}
		/>
	);
};

export default TrackContextualMenu;
