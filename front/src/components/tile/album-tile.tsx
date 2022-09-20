import {IconButton} from "@mui/material";
import {AccountCircle, Album} from "@mui/icons-material";
import Tile from "./tile";
import { AlbumWithArtist } from "../../models/album";
import Illustration from "../illustration";

const AlbumTile = (props: { album: AlbumWithArtist }) => {
	return <Tile
		title={props.album.name}
		subtitle={props.album.artist?.name}
		targetURL={`/albums/${props.album.artist?.slug ?? 'compilations'}+${props.album.slug}`}
		illustration={<Illustration url={props.album.illustration} fallback={<Album />}/>}
	/>
}

export default AlbumTile;