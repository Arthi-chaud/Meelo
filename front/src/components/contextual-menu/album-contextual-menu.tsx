import { AlbumWithArtist } from "../../models/album";
import { GoToAlbumReleasesAction, GoToArtistAction } from "../actions/link";
import { ShareAlbumAction } from "../actions/share";
import ContextualMenu from "./contextual-menu";

type AlbumContextualMenuProps = {
	album: AlbumWithArtist;
}

const AlbumContextualMenu = (props: AlbumContextualMenuProps) => {
	const albumSlug = `${props.album.artist?.slug ?? 'compilations'}+${props.album.slug}`;

	return <ContextualMenu actions={[
		[
			...props.album.artist ? [GoToArtistAction(props.album.artist.slug)] : [],
			GoToAlbumReleasesAction(albumSlug),
			ShareAlbumAction(albumSlug)
		]
	]}/>;
};

export default AlbumContextualMenu;
