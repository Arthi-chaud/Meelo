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

import { useConfirm } from "material-ui-confirm";
import { useTranslation } from "react-i18next";
import API from "../../../api/api";
import { useQueryClient } from "../../../api/use-query";
import type { VideoWithRelations } from "../../../models/video";
import type Action from "../../actions/action";
import { DownloadAction } from "../../actions/download";
import {
	GoToArtistAction,
	GoToReleaseAction,
	GoToSongInfoAction,
	GoToSongLyricsAction,
} from "../../actions/link";
import {
	AddToPlaylistAction,
	PlayAfterAction,
	PlayNextAction,
} from "../../actions/playlist";
import { RefreshTrackMetadataAction } from "../../actions/refresh-metadata";
import { ChangeVideoType } from "../../actions/resource-type";
import { ShowTrackFileInfoAction } from "../../actions/show-track-info";
import { UpdateTrackIllustrationAction } from "../../actions/update-illustration";
import { ContextualMenu } from "..";

type VideoContextualMenuProps = {
	video: VideoWithRelations<"master" | "illustration">;
	onSelect?: () => void;
};

const VideoContextualMenu = (props: VideoContextualMenuProps) => {
	const queryClient = useQueryClient();
	const confirm = useConfirm();
	const getPlayNextProps = () =>
		Promise.all([
			queryClient.fetchQuery(API.getArtist(props.video.artistId)),
			props.video.master.releaseId &&
				queryClient.fetchQuery(
					API.getRelease(props.video.master.releaseId),
				),
		]).then(([artist, release]) => ({
			track: {
				...props.video.master,
				illustration: props.video.illustration,
			},
			artist,
			release,
		}));
	const { t } = useTranslation();

	return (
		<ContextualMenu
			onSelect={props.onSelect}
			actions={[
				[
					GoToArtistAction(props.video.artistId),
					props.video.master.releaseId
						? GoToReleaseAction(props.video.master.releaseId)
						: undefined,
				].filter((a): a is Action => a !== undefined),
				props.video.songId
					? [
							GoToSongLyricsAction(props.video.songId),
							GoToSongInfoAction(props.video.songId),
						]
					: [],
				[
					PlayNextAction(getPlayNextProps),
					PlayAfterAction(getPlayNextProps),
				],
				props.video.songId
					? [AddToPlaylistAction(props.video.songId, queryClient)]
					: [],
				[
					ChangeVideoType(props.video, queryClient, confirm),
					UpdateTrackIllustrationAction(
						queryClient,
						props.video.master.id,
					),
					RefreshTrackMetadataAction(props.video.master.id, t),
				],
				[ShowTrackFileInfoAction(confirm, props.video.master.id)],
				[DownloadAction(confirm, props.video.master.sourceFileId, t)],
			]}
		/>
	);
};

export default VideoContextualMenu;
