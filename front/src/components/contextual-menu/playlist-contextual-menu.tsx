import Playlist from "../../models/playlist";
import { SharePlaylistAction } from "../actions/share";
import { UpdatePlaylistIllustrationAction } from "../actions/update-illustration";
import ContextualMenu from "./contextual-menu";
import { useQueryClient } from "../../api/use-query";
import { DeletePlaylistAction, UpdatePlaylistAction } from "../actions/playlist";
import { useConfirm } from "material-ui-confirm";
import { useRouter } from "next/router";

type PlaylistContextualMenuProps = {
	playlist: Playlist;
	onSelect?: () => void;
}

const PlaylistContextualMenu = (props: PlaylistContextualMenuProps) => {
	const queryClient = useQueryClient();
	const confirm = useConfirm();
	const router = useRouter();

	return <ContextualMenu onSelect={props.onSelect} actions={[
		[UpdatePlaylistAction(props.playlist, queryClient)],
		[UpdatePlaylistIllustrationAction(queryClient, props.playlist.slug)],
		[SharePlaylistAction(props.playlist.slug)],
		[DeletePlaylistAction(confirm, queryClient, props.playlist.slug, () => router.push('/playlists'))],
	]}/>;
};

export default PlaylistContextualMenu;
