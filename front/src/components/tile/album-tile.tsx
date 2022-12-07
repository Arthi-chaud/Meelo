import Tile from "./tile";
import { AlbumWithArtist } from "../../models/album";
import Illustration from "../illustration";

const AlbumTile = (props: { album: AlbumWithArtist }) => {
	return <Tile
		title={props.album.name}
		subtitle={props.album.artist?.name ?? 'Compilation'}
		href={`/albums/${props.album.artist?.slug ?? 'compilations'}+${props.album.slug}`}
		illustration={<Illustration url={props.album.illustration}/>}
	/>;
};

export default AlbumTile;
