import { AccountCircle, Lyrics, Audiotrack, Difference, PlaylistAdd, QueueMusic, Album, Download } from "@mui/icons-material";
import { Divider } from "@mui/material";
import { useRouter } from "next/router";
import API from "../../api";
import Artist from "../../models/artist";
import { ReleaseWithAlbum } from "../../models/release";
import Song, { SongWithArtist } from "../../models/song";
import { TrackWithSong } from "../../models/track";
import copyLinkToClipboard from "../../utils/copy-link";
import ContextualMenu from "./contextual-menu"
import ContextualMenuItem from "./contextual-menu-item";

import ShareIcon from '@mui/icons-material/Share';
type ReleaseTrackContextualMenuProps = {
	track: TrackWithSong;
	artist: Artist

}

const ReleaseTrackContextualMenu = (props: ReleaseTrackContextualMenuProps) => {
	const songSlug = `${props.artist.slug}+${props.track.song.slug}`;
	return <ContextualMenu>
		<ContextualMenuItem icon={<AccountCircle/>} href={`/artists/${props.artist.slug}`} label={"Go to Artist"}/>
		<ContextualMenuItem icon={<Lyrics/>} href={`/songs/${songSlug}/lyrics`} label={"See Lyrics"}/>
		<ContextualMenuItem icon={<Difference/>} href={`/songs/${songSlug}/tracks`} label={"See Related Tracks"}/>
		<ContextualMenuItem icon={<Audiotrack/>} href={`/songs/${songSlug}/versions`} label={"See Other Versions"}/>
		<ContextualMenuItem icon={<Download/>} label={"Download"} href={API.getStreamURL(props.track.stream)}/>
		<ContextualMenuItem icon={<ShareIcon/>} label={"Share Song"} onClick={() => copyLinkToClipboard(`/songs/${songSlug}/versions`)}/>
	</ContextualMenu>
}

export default ReleaseTrackContextualMenu;