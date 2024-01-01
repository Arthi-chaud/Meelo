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

import { useRouter } from "next/router";
import API from "../../api/api";
import ContextualMenu from "./contextual-menu";
import { useConfirm } from "material-ui-confirm";
import { DownloadAsyncAction } from "../actions/download";
import {
	GoToArtistAction,
	GoToRelatedTracksAction,
	GoToReleaseAsyncAction,
	GoToSongLyricsAction,
	GoToSongVersionAction,
} from "../actions/link";
import {
	AddToPlaylistAction,
	PlayAfterAction,
	PlayNextAction,
} from "../actions/playlist";
import { ShareSongAction } from "../actions/share";
import { ShowMasterTrackFileInfoAction } from "../actions/show-track-info";
import { useQueryClient } from "../../api/use-query";
import { toast } from "react-hot-toast";
import { translate } from "../../i18n/translate";
import { RefreshSongMetadataAction } from "../actions/refresh-metadata";
import { DeleteIcon } from "../icons";
import { SongVersionWithRelations } from "../../models/song-version";
import ChangeSongType from "../actions/song-type";

type SongVersionContextualMenuProps = {
	songVersion: SongVersionWithRelations<"featuring">;
	onSelect?: () => void;
	// Should be set if song is from a playlist
	entryId?: number;
};

const SongVersionContextualMenu = (props: SongVersionContextualMenuProps) => {
	const queryClient = useQueryClient();
	const getMasterTrack = () =>
		queryClient.fetchQuery(API.getMasterTrack(songSlug));
	const router = useRouter();
	const confirm = useConfirm();
	const getPlayNextProps = () =>
		getMasterTrack().then((master) => ({
			track: master,
			artist: props.song.artist,
		}));

	return (
		<ContextualMenu
			onSelect={props.onSelect}
			actions={[
				[
					GoToReleaseAsyncAction(
						router,
						async () => (await getMasterTrack()).releaseId,
					),
				],
				[GoToSongLyricsAction(props.songVersion.songId)],
				[
					PlayNextAction(getPlayNextProps),
					PlayAfterAction(getPlayNextProps),
				],
				[AddToPlaylistAction(props.songVersion.id, queryClient)],
				[
					GoToSongVersionAction(props.songVersion.song.id),
					GoToRelatedTracksAction(undefined),
				],
				[
					ChangeSongType(props.song.id),
					RefreshSongMetadataAction(props.song.id)
				],
				[
					ShowMasterTrackFileInfoAction(
						confirm,
						queryClient,
						props.song.id,
					),
				],
				[
					DownloadAsyncAction(confirm, () =>
						getMasterTrack().then((master) => master.stream),
					),
					ShareSongAction(songSlug),
				],
			].concat(
				props.entryId !== undefined
					? [
							[
								{
									label: "deleteFromPlaylist",
									icon: <DeleteIcon />,
									onClick: () =>
										API.deletePlaylistEntry(props.entryId!)
											.then(() => {
												toast.success(
													translate(
														"playlistItemDeletionSuccess",
													),
												);
												queryClient.client.invalidateQueries(
													"playlist",
												);
												queryClient.client.invalidateQueries(
													"playlists",
												);
											})
											.catch(() => {}),
								},
							],
						]
					: [],
			)}
		/>
	);
};

export default SongContextualMenu;
