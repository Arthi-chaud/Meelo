import Illustration from '../illustration';
import ListItem from "./item";
import AlbumContextualMenu from "../contextual-menu/album-contextual-menu";
import { AlbumWithRelations } from '../../models/album';

type AlbumItemProps = {
	album: AlbumWithRelations<['artist']>;
}

/**
 * Item for a list of albums
 * @param props
 * @returns
 */
const AlbumItem = ({ album }: AlbumItemProps) => {
	const artist = album.artist;

	return (
		<ListItem
			icon={<Illustration url={album.illustration}/>}
			href={`/albums/${artist?.slug ?? 'compilations'}+${album.slug}`}
			title={album.name}
			secondTitle={artist?.name ?? 'Compilations'}
			trailing={<AlbumContextualMenu album={album} />}
		/>
	);
};

export default AlbumItem;
