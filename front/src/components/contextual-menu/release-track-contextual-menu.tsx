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

import Artist from "../../models/artist";
import ContextualMenu from "./contextual-menu";
import { useConfirm } from "material-ui-confirm";
import { DownloadAction } from "../actions/download";
import {
	GoToArtistAction,
	GoToRelatedTracksAction,
	GoToSongLyricsAction,
	GoToSongVersionAction,
} from "../actions/link";
import {
	AddToPlaylistAction,
	PlayAfterAction,
	PlayNextAction,
} from "../actions/playlist";
import { ShareSongAction } from "../actions/share";
import { ShowTrackFileInfoAction } from "../actions/show-track-info";
import { TrackWithRelations } from "../../models/track";
import { UpdateTrackIllustrationAction } from "../actions/update-illustration";
import { useQueryClient } from "../../api/use-query";
import { RefreshTrackMetadataAction } from "../actions/refresh-metadata";
import ChangeSongType from "../actions/song-type";

type ReleaseTrackContextualMenuProps = {
	track: TrackWithRelations<"songVersion">;
	artist: Artist;
	onSelect?: () => void;
};

const ReleaseTrackContextualMenu = (props: ReleaseTrackContextualMenuProps) => {
	const parentSongId = props.track.songVersion.songId;
	const confirm = useConfirm();
	const queryClient = useQueryClient();

	return (
		<ContextualMenu
			onSelect={props.onSelect}
			actions={[
				[GoToArtistAction(props.artist.slug)],
				[GoToSongLyricsAction(parentSongId)],
				[
					PlayNextAction(async () => props),
					PlayAfterAction(async () => props),
				],
				[AddToPlaylistAction(props.track.songVersionId, queryClient)],
				[
					GoToSongVersionAction(parentSongId),
					GoToRelatedTracksAction(parentSongId),
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
				[
					DownloadAction(confirm, props.track.stream),
					ShareSongAction(parentSongId),
				],
			]}
		/>
	);
};

export default ReleaseTrackContextualMenu;
