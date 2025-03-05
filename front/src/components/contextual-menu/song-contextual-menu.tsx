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
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import API from "../../api/api";
import { useQueryClient } from "../../api/use-query";
import type { SongWithRelations } from "../../models/song";
import { DownloadAsyncAction } from "../actions/download";
import {
	GoToArtistAction,
	GoToRelatedTracksAction,
	GoToReleaseAsyncAction,
	GoToSongInfoAction,
	GoToSongLyricsAction,
	GoToSongVersionAction,
} from "../actions/link";
import {
	AddToPlaylistAction,
	PlayAfterAction,
	PlayNextAction,
} from "../actions/playlist";
import { RefreshSongMetadataAction } from "../actions/refresh-metadata";
import { ChangeSongType } from "../actions/resource-type";
import { ShareSongAction } from "../actions/share";
import { ShowMasterTrackFileInfoAction } from "../actions/show-track-info";
import { DeleteIcon } from "../icons";
import ContextualMenu from "./contextual-menu";

type SongContextualMenuProps = {
	song: SongWithRelations<"artist">;
	onSelect?: () => void;
	// Should be set if song is from a playlist
	entryId?: number;
};

const SongContextualMenu = (props: SongContextualMenuProps) => {
	const songSlug = props.song.slug;
	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const getMasterTrack = () =>
		queryClient.fetchQuery(
			API.getSongMasterTrack(songSlug, ["release", "illustration"]),
		);
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
					GoToArtistAction(props.song.artist.slug),
					GoToReleaseAsyncAction(
						router,
						async () =>
							(await getMasterTrack()).release?.slug ?? null,
					),
				],
				[GoToSongLyricsAction(songSlug), GoToSongInfoAction(songSlug)],
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
						() =>
							getMasterTrack().then(
								({ sourceFileId }) => sourceFileId,
							),
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
