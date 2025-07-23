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

import { useQueryClient } from "~/api";
import type Artist from "@/models/artist";
import type { TrackWithRelations } from "@/models/track";
import { useConfirm } from "material-ui-confirm";
import { useTranslation } from "react-i18next";
import { DownloadAction } from "~/components/actions/download";
import {
	GoToArtistAction,
	GoToRelatedTracksAction,
	GoToSongInfoAction,
	GoToSongLyricsAction,
	GoToSongVersionAction,
} from "~/components/actions/link";
import {
	AddToPlaylistAction,
	PlayAfterAction,
	PlayNextAction,
} from "~/components/actions/playlist";
import { RefreshTrackMetadataAction } from "~/components/actions/refresh-metadata";
import { ChangeSongType } from "~/components/actions/resource-type";
import { ShareSongAction } from "~/components/actions/share";
import { ShowTrackFileInfoAction } from "~/components/actions/show-track-info";
import { UpdateTrackIllustrationAction } from "~/components/actions/update-illustration";
import { ContextualMenu } from "..";

type ReleaseTrackContextualMenuProps = {
	track: TrackWithRelations<"song" | "illustration">;
	artist: Artist;
	onSelect?: () => void;
};

const ReleaseTrackContextualMenu = (props: ReleaseTrackContextualMenuProps) => {
	const songSlug = props.track.song?.slug;
	const confirm = useConfirm();
	const queryClient = useQueryClient();
	const { t } = useTranslation();

	return (
		<ContextualMenu
			onSelect={props.onSelect}
			actions={[
				[GoToArtistAction(props.artist.slug)],
				songSlug
					? [
							GoToSongLyricsAction(songSlug),
							GoToSongInfoAction(songSlug),
						]
					: [],
				[
					PlayNextAction(async () => props),
					PlayAfterAction(async () => props),
				],
				props.track.songId
					? [AddToPlaylistAction(props.track.songId, queryClient)]
					: [],
				songSlug
					? [
							GoToSongVersionAction(songSlug),
							GoToRelatedTracksAction(songSlug),
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
				[
					DownloadAction(
						queryClient.api,
						confirm,
						props.track.sourceFileId,
						t,
					),
					...(songSlug ? [ShareSongAction(songSlug, t)] : []),
				],
			]}
		/>
	);
};

export default ReleaseTrackContextualMenu;
