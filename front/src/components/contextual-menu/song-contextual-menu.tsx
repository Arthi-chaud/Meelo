import { AccountCircle, Lyrics, Audiotrack, Difference, PlaylistAdd, QueueMusic, Album, Download, PlaylistPlay } from "@mui/icons-material";
import { Divider } from "@mui/material";
import { useRouter } from "next/router";
import API from "../../api";
import { ReleaseWithAlbum } from "../../models/release";
import Song, { SongWithArtist } from "../../models/song";
import copyLinkToClipboard from "../../utils/copy-link";
import ContextualMenu from "./contextual-menu"
import ContextualMenuItem from "./contextual-menu-item";
import ShareIcon from '@mui/icons-material/Share';
import downloadAction from "../download-action";
import { useDispatch } from "react-redux";
import { playAfter, playNext } from "../../state/playerSlice";
import { TrackWithRelease } from "../../models/track";
import Action, { DownloadAction, DownloadAsyncAction, GoToAlbumAction, GoToArtistAction, GoToRelatedTracksAction, GoToReleaseAsyncAction, GoToSongLyricsAction, GoToSongVersionAction, PlayAfterAction, PlayNextAction, ShareSongAction } from "./actions";

type SongContextualMenuProps = {
	song: SongWithArtist;
	onSelect?: () => void;
}

const SongContextualMenu = (props: SongContextualMenuProps) => {
	const songSlug = `${props.song.artist.slug}+${props.song.slug}`;
	const getMasterTrack = () => API.getMasterTrack<TrackWithRelease>(songSlug, ['release']);
	const router = useRouter();
	const getPlayNextProps = () => getMasterTrack().then((master) => ({ track: master, artist: props.song.artist, release: master.release }))
	return <ContextualMenu onSelect={props.onSelect} actions={[[
		GoToArtistAction(props.song.artist.slug),
		GoToReleaseAsyncAction(router, async () => (await getMasterTrack()).releaseId),
	], [
		GoToSongLyricsAction(songSlug)
	], [
		PlayNextAction(getPlayNextProps),
		PlayAfterAction(getPlayNextProps),
	], [
		GoToSongVersionAction(songSlug),
		GoToRelatedTracksAction(songSlug),
	], [
		DownloadAsyncAction(router, () => API.getMasterTrack(songSlug).then((master) => master.stream)),
		ShareSongAction(songSlug)
	]]}/>
}

export default SongContextualMenu;