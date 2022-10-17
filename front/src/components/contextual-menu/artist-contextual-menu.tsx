import { Audiotrack, Album } from "@mui/icons-material";
import Artist from "../../models/artist";
import ContextualMenu from "./contextual-menu"
import ContextualMenuItem from "./contextual-menu-item";
type ArtistContextualMenuProps = {
	artist: Artist;
}

const ArtistContextualMenu = (props: ArtistContextualMenuProps) => {
	const artistSlug = props.artist.slug;
	return <ContextualMenu>
		<ContextualMenuItem icon={<Album/>} href={`/artists/${artistSlug}/albums`} label={"See Albums"}/>
		<ContextualMenuItem icon={<Audiotrack/>} href={`/artists/${artistSlug}/songs`} label={"See Songs"}/>
	</ContextualMenu>
}

export default ArtistContextualMenu;