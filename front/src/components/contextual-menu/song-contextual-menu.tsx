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
import Action from "../action";
type SongContextualMenuProps = {
	song: SongWithArtist;
	onSelect?: () => void;
}

const SongContextualMenu = (props: SongContextualMenuProps) => {
	const songSlug = `${props.song.artist.slug}+${props.song.slug}`;
	const getMasterTrack = () => API.getMasterTrack<TrackWithRelease>(songSlug, ['release']);
	const router = useRouter();
	const dispatch = useDispatch();
	return <ContextualMenu onSelect={props.onSelect}>
		<ContextualMenuItem icon={<AccountCircle/>} href={`/artists/${props.song.artist.slug}`} label={"Go to Artist"}/>
		<ContextualMenuItem icon={<Album/>} label={"Go to Album"}
			onClick={() => getMasterTrack()
				.then((master) => router.push(`/releases/${master.releaseId}`))
			}
		/>
		<ContextualMenuItem icon={<Lyrics/>} href={`/songs/${songSlug}/lyrics`} label={"See Lyrics"}/>
		<Divider/>
		<ContextualMenuItem icon={<PlaylistPlay/>} label={"Play Next"}
			onClick={() => getMasterTrack()
				.then((master) => dispatch(playNext({ track: master, artist: props.song.artist, release: master.release })))
			}
		/>
		<ContextualMenuItem icon={<PlaylistAdd/>} label={"Play After"}
			onClick={() => getMasterTrack()
				.then((master) => dispatch(playAfter({ track: master, artist: props.song.artist, release: master.release })))
			}
		/>
		<Divider/>
		<ContextualMenuItem icon={<Audiotrack/>} href={`/songs/${songSlug}/versions`} label={"See Other Versions"}/>
		<ContextualMenuItem icon={<Difference/>} href={`/songs/${songSlug}/tracks`} label={"See Related Tracks"}/>
		<Divider/>
		<ContextualMenuItem icon={<Download/>} label={"Download"}
			onClick={() => API.getMasterTrack(songSlug).then((track) => downloadAction(router, API.getStreamURL(track.stream)))}
		/>
		<Divider/>
		<ContextualMenuItem icon={<ShareIcon/>} label={"Share Song"} onClick={() => copyLinkToClipboard(`/songs/${songSlug}/versions`)}/>
	</ContextualMenu>
}

export default SongContextualMenu;