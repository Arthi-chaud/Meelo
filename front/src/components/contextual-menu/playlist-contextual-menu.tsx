import Playlist from "../../models/playlist";
import { SharePlaylistAction } from "../actions/share";
import { UpdatePlaylistIllustrationAction } from "../actions/update-illustration";
import ContextualMenu from "./contextual-menu";
import { useQueryClient } from "../../api/use-query";

type PlaylistContextualMenuProps = {
	playlist: Playlist;
	onSelect?: () => void;
}

const PlaylistContextualMenu = (props: PlaylistContextualMenuProps) => {
	const queryClient = useQueryClient();

	return <ContextualMenu onSelect={props.onSelect} actions={[
		[UpdatePlaylistIllustrationAction(queryClient, props.playlist.slug)],
		[SharePlaylistAction(props.playlist.slug)]
	]}/>;
};

export default PlaylistContextualMenu;
