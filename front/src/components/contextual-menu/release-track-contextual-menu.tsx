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
type ReleaseTrackContextualMenuProps = {
	track: TrackWithSong;
	artist: Artist;
	release: Release;
	onSelect?: () => void;
}

const ReleaseTrackContextualMenu = (props: ReleaseTrackContextualMenuProps) => {
	const songSlug = `${props.artist.slug}+${props.track.song.slug}`;
	const router = useRouter();
	const dispatch = useDispatch();
	return <ContextualMenu onSelect={props.onSelect}>
		<ContextualMenuItem icon={<AccountCircle/>} href={`/artists/${props.artist.slug}`} label={"Go to Artist"}/>
		<ContextualMenuItem icon={<Download/>} label={"Download"} onClick={() => downloadAction(router, API.getStreamURL(props.track.stream))}/>
		<Divider/>
		<ContextualMenuItem icon={<Lyrics/>} href={`/songs/${songSlug}/lyrics`} label={"See Lyrics"}/>
		<Divider/>
		<ContextualMenuItem icon={<PlaylistPlay/>} label={"Play Next"}
			onClick={() => dispatch(playNext(props))}
		/>
		<ContextualMenuItem icon={<PlaylistAdd/>} label={"Play After"}
			onClick={() => dispatch(playNext(props))}
		/>
		<Divider/>
		<ContextualMenuItem icon={<Audiotrack/>} href={`/songs/${songSlug}/versions`} label={"See Other Versions"}/>
		<ContextualMenuItem icon={<Difference/>} href={`/songs/${songSlug}/tracks`} label={"See Related Tracks"}/>
		<Divider/>
		<ContextualMenuItem icon={<ShareIcon/>} label={"Share Song"} onClick={() => copyLinkToClipboard(`/songs/${songSlug}/versions`)}/>
	</ContextualMenu>
}

export default ReleaseTrackContextualMenu;