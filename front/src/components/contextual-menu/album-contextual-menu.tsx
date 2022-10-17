import { AccountCircle, Album } from "@mui/icons-material";
import { Divider } from "@mui/material";
import { AlbumWithArtist } from "../../models/album";
import Song, { SongWithArtist } from "../../models/song";
import ContextualMenu from "./contextual-menu"
import ContextualMenuItem from "./contextual-menu-item";
type AlbumContextualMenuProps = {
	album: AlbumWithArtist;
}

const AlbumContextualMenu = (props: AlbumContextualMenuProps) => {
	const albumSlug = `${props.album.artist?.slug ?? 'compilations'}+${props.album.slug}`
	return <ContextualMenu>
		{ props.album.artist ?
			<ContextualMenuItem icon={<AccountCircle/>} href={`/artists/${props.album.artist.slug}`} label={"Go to Artist"}/>
			: <></>
		}
		<ContextualMenuItem icon={<Album/>} href={`/albums/${albumSlug}/releases`} label={"See Releases"}/>
	</ContextualMenu>
}

export default AlbumContextualMenu;