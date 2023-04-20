import Playlist from "../../models/playlist";
import { QueueMusic } from "@mui/icons-material";
import Tile from "./tile";
import Illustration from "../illustration";

const PlaylistTile = (props: { playlist: Playlist }) => {
	return <Tile
		title={props.playlist.name}
		href={`/playlists/${props.playlist.slug}`}
		illustration={<Illustration url={props.playlist.illustration} style={{ objectFit: "cover" }} fallback={<QueueMusic />}/>}
	/>;
};

export default PlaylistTile;
