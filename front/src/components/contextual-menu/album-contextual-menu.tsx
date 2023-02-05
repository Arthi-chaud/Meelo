import { useConfirm } from "material-ui-confirm";
import API from "../../api/api";
import { DownloadReleaseAsyncAction } from "../actions/download";
import { GoToAlbumReleasesAction, GoToArtistAction } from "../actions/link";
import { ShareAlbumAction } from "../actions/share";
import ContextualMenu from "./contextual-menu";
import { AlbumWithRelations } from "../../models/album";

type AlbumContextualMenuProps = {
	album: AlbumWithRelations<['artist']>;
}

const AlbumContextualMenu = (props: AlbumContextualMenuProps) => {
	const albumSlug = `${props.album.artist?.slug ?? 'compilations'}+${props.album.slug}`;
	const confirm = useConfirm();

	return <ContextualMenu actions={[
		[
			...props.album.artist ? [GoToArtistAction(props.album.artist.slug)] : [],
			GoToAlbumReleasesAction(albumSlug),
		], [
			DownloadReleaseAsyncAction(
				confirm,
				() => API.getMasterRelease(albumSlug).exec().then((release) => release.id)
			),
		], [ShareAlbumAction(albumSlug)]
	]}/>;
};

export default AlbumContextualMenu;
