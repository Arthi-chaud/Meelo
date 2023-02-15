import Tile from "./tile";
import { AlbumWithRelations } from "../../models/album";
import Illustration from "../illustration";

const AlbumTile = (props: {
	album: AlbumWithRelations<'artist'>,
	formatSubtitle?: (album: AlbumWithRelations<'artist'>) => string
}) => {
	return <Tile
		title={props.album.name}
		subtitle={props.formatSubtitle?.call(this, props.album) ?? props.album.artist?.name ?? 'Compilation'}
		href={`/albums/${props.album.artist?.slug ?? 'compilations'}+${props.album.slug}`}
		illustration={<Illustration url={props.album.illustration}/>}
	/>;
};

export default AlbumTile;
