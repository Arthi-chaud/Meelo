import { useConfirm } from "material-ui-confirm";
import API from "../../api/api";
import { DownloadReleaseAsyncAction } from "../actions/download";
import { GoToArtistAction } from "../actions/link";
import { ShareAlbumAction } from "../actions/share";
import ContextualMenu from "./contextual-menu";
import { AlbumWithRelations } from "../../models/album";
import { useQueryClient } from "../../api/use-query";
import ChangeAlbumType from "../actions/album-type";
import { RefreshAlbumMetadataAction } from "../actions/refresh-metadata";

type AlbumContextualMenuProps = {
	album: AlbumWithRelations<'artist'>;
}

const AlbumContextualMenu = (props: AlbumContextualMenuProps) => {
	const albumSlug = `${props.album.artist?.slug ?? 'compilations'}+${props.album.slug}`;
	const confirm = useConfirm();
	const queryClient = useQueryClient();

	return <ContextualMenu actions={[
		[...props.album.artist ? [GoToArtistAction(props.album.artist.slug)] : []],
		[
			ChangeAlbumType(props.album, queryClient, confirm),
			RefreshAlbumMetadataAction(albumSlug)
		],
		[
			DownloadReleaseAsyncAction(
				confirm,
				() => queryClient.fetchQuery(API.getMasterRelease(albumSlug))
					.then((release) => release.id)
			),
		],
		[ShareAlbumAction(albumSlug)]
	]}/>;
};

export default AlbumContextualMenu;
