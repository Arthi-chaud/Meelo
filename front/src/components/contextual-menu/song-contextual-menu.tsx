import { AccountCircle, Lyrics, Audiotrack, Difference, PlaylistAdd, QueueMusic, Album } from "@mui/icons-material";
import { Divider } from "@mui/material";
import { useRouter } from "next/router";
import API from "../../api";
import { ReleaseWithAlbum } from "../../models/release";
import Song, { SongWithArtist } from "../../models/song";
import ContextualMenu from "./contextual-menu"
import ContextualMenuItem from "./contextual-menu-item";
type SongContextualMenuProps = {
	song: SongWithArtist;
}

const SongContextualMenu = (props: SongContextualMenuProps) => {
	const songSlug = `${props.song.artist.slug}+${props.song.slug}`;
	const router = useRouter();
	return <ContextualMenu>
		<ContextualMenuItem icon={<AccountCircle/>} href={`/artists/${props.song.artist.slug}`} label={"Go to Artist"}/>
		<ContextualMenuItem icon={<Album/>} label={"Go to Album"}
			onClick={() => API.getMasterTrack(songSlug)
				.then((master) => router.push(`/releases/${master.releaseId}`))
			}
		/>
		<ContextualMenuItem icon={<Lyrics/>} href={`/songs/${songSlug}/lyrics`} label={"See Lyrics"}/>
		<ContextualMenuItem icon={<Audiotrack/>} href={`/songs/${songSlug}/tracks`} label={"See Tracks"}/>
		<ContextualMenuItem icon={<Difference/>} href={`/songs/${songSlug}/versions`} label={"See Versions"}/>
	</ContextualMenu>
}

export default SongContextualMenu;