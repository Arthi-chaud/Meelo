import { AccountCircle, Lyrics, Audiotrack, Difference, PlaylistAdd, QueueMusic, Album, Download, PlaylistPlay } from "@mui/icons-material";
import { Divider } from "@mui/material";
import { useRouter } from "next/router";
import API from "../../api";
import Artist from "../../models/artist";
import Release, { ReleaseWithAlbum } from "../../models/release";
import Song, { SongWithArtist } from "../../models/song";
import { TrackWithSong } from "../../models/track";
import copyLinkToClipboard from "../../utils/copy-link";
import ContextualMenu from "./contextual-menu"
import ContextualMenuItem from "./contextual-menu-item";

import ShareIcon from '@mui/icons-material/Share';
import downloadAction from "../download-action";
import { playNext, playAfter } from "../../state/playerSlice";
import { useDispatch } from "react-redux";
import { DownloadAction, GoToArtistAction, GoToRelatedTracksAction, GoToSongLyricsAction, GoToSongVersionAction, PlayAfterAction, PlayNextAction, ShareSongAction } from "./actions";
type ReleaseTrackContextualMenuProps = {
	track: TrackWithSong;
	artist: Artist;
	release: Release;
	onSelect?: () => void;
}

const ReleaseTrackContextualMenu = (props: ReleaseTrackContextualMenuProps) => {
	const songSlug = `${props.artist.slug}+${props.track.song.slug}`;
	const router = useRouter();
	return <ContextualMenu onSelect={props.onSelect} actions={[[
		GoToArtistAction(props.artist.slug),
	], [
		GoToSongLyricsAction(songSlug)
	], [
		PlayNextAction(async () => props),
		PlayAfterAction(async () => props)
	], [
		GoToSongVersionAction(songSlug),
		GoToRelatedTracksAction(songSlug),
	],[
		DownloadAction(router, props.track.stream),
		ShareSongAction(songSlug)
	]]}/>
}

export default ReleaseTrackContextualMenu;