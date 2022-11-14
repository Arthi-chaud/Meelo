import { AccountCircle, Album } from "@mui/icons-material";
import { Divider } from "@mui/material";
import { AlbumWithArtist } from "../../models/album";
import Song, { SongWithArtist } from "../../models/song";
import ContextualMenu from "./contextual-menu"
import ContextualMenuItem from "./contextual-menu-item";
import ShareIcon from '@mui/icons-material/Share';
import copyLinkToClipboard from "../../utils/copy-link";
import { GoToAlbumReleasesAction, GoToArtistAction, ShareAlbumAction } from "./actions";
type AlbumContextualMenuProps = {
	album: AlbumWithArtist;
}

const AlbumContextualMenu = (props: AlbumContextualMenuProps) => {
	const albumSlug = `${props.album.artist?.slug ?? 'compilations'}+${props.album.slug}`
	return <ContextualMenu actions={[[
		...(props.album.artist ? [GoToArtistAction(props.album.artist.slug)] : []),
		GoToAlbumReleasesAction(albumSlug),
		ShareAlbumAction(albumSlug)
	]]}/>
}

export default AlbumContextualMenu;