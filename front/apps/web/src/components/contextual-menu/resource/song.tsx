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
import { getSongMasterTrack } from "@/api/queries";
import type { SongWithRelations } from "@/models/song";
import { DeleteIcon } from "@/ui/icons";
import { useQueryClient } from "~/api";
import { DownloadAsyncAction } from "~/components/actions/download";
import { EditExternalLinksAction } from "~/components/actions/edit-external-links";
import {
	GoToArtistAction,
	GoToRelatedTracksAction,
	GoToReleaseAsyncAction,
	GoToSongInfoAction,
	GoToSongLyricsAction,
	GoToSongVersionAction,
} from "~/components/actions/link";
import { MergeSongAction } from "~/components/actions/merge";
import {
	AddToPlaylistAction,
	PlayAfterAction,
	PlayNextAction,
} from "~/components/actions/playlist";
import { RefreshSongMetadataAction } from "~/components/actions/refresh-metadata";
import { ChangeSongType } from "~/components/actions/resource-type";
import { ShareSongAction } from "~/components/actions/share";
import { ShowMasterTrackFileInfoAction } from "~/components/actions/show-track-info";
import { ContextualMenu } from "..";

type SongContextualMenuProps = {
	song: SongWithRelations<"artist" | "featuring">;
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
			getSongMasterTrack(songSlug, ["release", "illustration"]),
		);
	const router = useRouter();
	const confirm = useConfirm();
	const getPlayNextProps = () =>
		getMasterTrack().then((master) => ({
			track: master,
			artist: props.song.artist,
			featuring: props.song.featuring,
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
				[AddToPlaylistAction({ songId: props.song.id }, queryClient)],
				[
					GoToSongVersionAction(songSlug),
					GoToRelatedTracksAction(songSlug),
				],
				[
					ChangeSongType(props.song, queryClient),
					RefreshSongMetadataAction(props.song.id, t),
					EditExternalLinksAction("song", props.song.id),
					MergeSongAction(props.song, queryClient),
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
						queryClient.api,
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
									label: "actions.deleteFromPlaylist",
									icon: <DeleteIcon />,
									onClick: () =>
										queryClient.api
											.deletePlaylistEntry(props.entryId!)
											.then(() => {
												toast.success(
													t(
														"toasts.playlist.itemDeletionSuccess",
													),
												);
												queryClient.client.invalidateQueries(
													{
														queryKey: ["playlist"],
													},
												);
												queryClient.client.invalidateQueries(
													{
														queryKey: ["playlists"],
													},
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
