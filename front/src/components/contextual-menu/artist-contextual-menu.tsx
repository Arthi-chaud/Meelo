import { Audiotrack, Album } from "@mui/icons-material";
import Artist from "../../models/artist";
import copyLinkToClipboard from "../../utils/copy-link";
import ContextualMenu from "./contextual-menu"
import ContextualMenuItem from "./contextual-menu-item";
import ShareIcon from '@mui/icons-material/Share';
type ArtistContextualMenuProps = {
	artist: Artist;
}

const ArtistContextualMenu = (props: ArtistContextualMenuProps) => {
	const artistSlug = props.artist.slug;
	return <ContextualMenu>
		<ContextualMenuItem icon={<Album/>} href={`/artists/${artistSlug}/albums`} label={"See Albums"}/>
		<ContextualMenuItem icon={<Audiotrack/>} href={`/artists/${artistSlug}/songs`} label={"See Songs"}/>
		<ContextualMenuItem icon={<ShareIcon/>} label={"Share Artist"} onClick={() => copyLinkToClipboard(`/artists/${artistSlug}`)}/>
	</ContextualMenu>
}

export default ArtistContextualMenu;