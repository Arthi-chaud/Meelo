import { useRouter } from "next/router";
import API from "../../api/api";
import ContextualMenu from "./contextual-menu";
import { useConfirm } from "material-ui-confirm";
import { DownloadAsyncAction } from "../actions/download";
import {
	GoToArtistAction, GoToRelatedTracksAction, GoToReleaseAsyncAction,
	GoToSongLyricsAction, GoToSongVersionAction
} from "../actions/link";
import { PlayAfterAction, PlayNextAction } from "../actions/playlist";
import { ShareSongAction } from "../actions/share";
import { ShowMasterTrackFileInfoAction } from "../actions/show-track-info";
import { SongWithRelations } from "../../models/song";
import { useQueryClient } from "../../api/use-query";
import { Delete } from "@mui/icons-material";
import { toast } from "react-hot-toast";

type SongContextualMenuProps = {
	song: SongWithRelations<'artist'>;
	onSelect?: () => void;
	// Should be set if song is from a playlist
	entryId?: number
}

const SongContextualMenu = (props: SongContextualMenuProps) => {
	const songSlug = `${props.song.artist.slug}+${props.song.slug}`;
	const queryClient = useQueryClient();
	const getMasterTrack = () => queryClient.fetchQuery(
		API.getMasterTrack(songSlug, ['release'])
	);
	const router = useRouter();
	const confirm = useConfirm();
	const getPlayNextProps = () => getMasterTrack()
		.then((master) => ({ track: master, artist: props.song.artist, release: master.release }));

	return <ContextualMenu onSelect={props.onSelect} actions={[
		[
			GoToArtistAction(props.song.artist.slug),
			GoToReleaseAsyncAction(
				router, async () => (await getMasterTrack()).releaseId
			)
		],
		[GoToSongLyricsAction(songSlug)],
		[PlayNextAction(getPlayNextProps), PlayAfterAction(getPlayNextProps)],
		[GoToSongVersionAction(songSlug), GoToRelatedTracksAction(songSlug)],
		[ShowMasterTrackFileInfoAction(confirm, queryClient, props.song.id)],
		[
			DownloadAsyncAction(
				confirm,
				() => getMasterTrack().then((master) => master.stream)
			),
			ShareSongAction(songSlug)
		],
	].concat(props.entryId !== undefined ? [
		[
			{
				label: 'Delete from Playlist',
				icon: <Delete/>,
				onClick: () => API.deletePlaylistEntry(props.entryId!)
					.then(() => {
						toast.success('Deletion Successful');
						queryClient.client.invalidateQueries('playlist');
						queryClient.client.invalidateQueries('playlists');
					})
					.catch(() => {})
			}
		]
	] : [])}/>;
};

export default SongContextualMenu;
