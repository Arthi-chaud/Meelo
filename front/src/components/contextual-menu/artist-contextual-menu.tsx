import Artist from "../../models/artist";
import ContextualMenu from "./contextual-menu";
import {
	GoToArtistAction, GoToArtistAlbumsAction, GoToArtistSongsAction
} from "../actions/link";
import { ShareArtistAction } from "../actions/share";

type ArtistContextualMenuProps = {
	artist: Artist;
}

const ArtistContextualMenu = (props: ArtistContextualMenuProps) => {
	const artistSlug = props.artist.slug;

	return <ContextualMenu actions={[
		[
			GoToArtistAction(artistSlug),
			GoToArtistAlbumsAction(artistSlug),
			GoToArtistSongsAction(artistSlug),
		],
		[ShareArtistAction(artistSlug)]
	]}/>;
};

export default ArtistContextualMenu;
