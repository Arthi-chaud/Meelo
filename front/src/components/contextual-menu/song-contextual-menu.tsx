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
import { translate } from "../../i18n/translate";
import ChangeSongType from "../actions/song-type";
import { RefreshSongMetadataAction } from "../actions/refresh-metadata";
import { DeleteIcon } from "../icons";

type SongContextualMenuProps = {
	song: SongWithRelations<"artist">;
	onSelect?: () => void;
	// Should be set if song is from a playlist
	entryId?: number;
};

const SongContextualMenu = (props: SongContextualMenuProps) => {
	const songSlug = `${props.song.artist.slug}+${props.song.slug}`;
	const queryClient = useQueryClient();
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
					RefreshSongMetadataAction(props.song.id),
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
				props.entryId !== undefined ?
					[
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
				:	[],
			)}
		/>
	);
};

export default SongContextualMenu;
