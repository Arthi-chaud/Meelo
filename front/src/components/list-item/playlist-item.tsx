import { QueueMusic } from "@mui/icons-material";
import Playlist from "../../models/playlist";
import Illustration from "../illustration";
import ListItem from "./item";
import PlaylistContextualMenu from "../contextual-menu/playlist-contextual-menu";

type PlaylistItemProps = {
	playlist: Playlist
}

/**
 * Item for a list of Playlists
 * @param props
 * @returns
 */
const PlaylistItem = ({ playlist }: PlaylistItemProps) => {
	return <ListItem
		icon={<Illustration
			illustration={playlist.illustration}
			style={{ objectFit: "cover" }}
			fallback={<QueueMusic />} />
		}
		href={`/playlists/${playlist.slug}`}
		title={playlist.name}
		trailing={<PlaylistContextualMenu playlist={playlist} />}
	/>;
};

export default PlaylistItem;
