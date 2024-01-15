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
import { SongWithRelations } from "../../models/song";
import { useQueryClient } from "../../api/use-query";
import { toast } from "react-hot-toast";
import ChangeSongType from "../actions/song-type";
import { RefreshSongMetadataAction } from "../actions/refresh-metadata";
import { DeleteIcon } from "../icons";
import { useTranslation } from "react-i18next";

type SongContextualMenuProps = {
	song: SongWithRelations<"artist">;
	onSelect?: () => void;
	// Should be set if song is from a playlist
	entryId?: number;
};

const SongContextualMenu = (props: SongContextualMenuProps) => {
	const songSlug = `${props.song.artist.slug}+${props.song.slug}`;
	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const getMasterTrack = () =>
		queryClient.fetchQuery(API.getMasterTrack(songSlug, ["release"]));
	const router = useRouter();
	const confirm = useConfirm();
	const getPlayNextProps = () =>
		getMasterTrack().then((master) => ({
			track: master,
			artist: props.song.artist,
			release: master.release,
		}));

	return (
		<ContextualMenu
			onSelect={props.onSelect}
			actions={[
				[
					GoToArtistAction(props.song.artist.slug),
					GoToReleaseAsyncAction(
						router,
						async () => (await getMasterTrack()).releaseId,
					),
				],
				[GoToSongLyricsAction(songSlug)],
				[
					PlayNextAction(getPlayNextProps),
					PlayAfterAction(getPlayNextProps),
				],
				[AddToPlaylistAction(props.song.id, queryClient)],
				[
					GoToSongVersionAction(songSlug),
					GoToRelatedTracksAction(songSlug),
				],
				[
					ChangeSongType(props.song, queryClient, confirm),
					RefreshSongMetadataAction(props.song.id, t),
				],
				[
					ShowMasterTrackFileInfoAction(
						confirm,
						queryClient,
						props.song.id,
					),
				],
				[
					DownloadAsyncAction(
						confirm,
						() => getMasterTrack().then((master) => master.stream),
						t,
					),
					ShareSongAction(songSlug, t),
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
													t(
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
