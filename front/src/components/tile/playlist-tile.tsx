import Playlist from "../../models/playlist";
import Tile from "./tile";
import Illustration from "../illustration";
import PlaylistContextualMenu from "../contextual-menu/playlist-contextual-menu";
import { PlaylistIcon } from "../icons";

const PlaylistTile = (props: { playlist: Playlist }) => {
	return <Tile
		contextualMenu={<PlaylistContextualMenu playlist={props.playlist}/>}
		title={props.playlist.name}
		href={`/playlists/${props.playlist.slug}`}
		illustration={<Illustration illustration={props.playlist.illustration} style={{ objectFit: "cover" }} fallback={<PlaylistIcon />}/>}
	/>;
};

export default PlaylistTile;
