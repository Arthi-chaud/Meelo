import Illustration from '../illustration';
import ListItem from "./item";
import AlbumContextualMenu from "../contextual-menu/album-contextual-menu";
import { AlbumWithRelations } from '../../models/album';
import { useMemo } from 'react';
import { translate, useLanguage } from '../../i18n/translate';

type AlbumItemProps = {
	album: AlbumWithRelations<'artist'>;
	formatSubtitle?: (album: AlbumWithRelations<'artist'>) => string
}

/**
 * Item for a list of albums
 * @param props
 * @returns
 */
const AlbumItem = ({ album, formatSubtitle }: AlbumItemProps) => {
	const artist = album.artist;
	const language = useLanguage();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const compilationKeyword = useMemo(() => translate('compilation'), [language]);

	return (
		<ListItem
			icon={<Illustration illustration={album.illustration}/>}
			href={`/albums/${artist?.slug ?? 'compilations'}+${album.slug}`}
			title={album.name}
			secondTitle={formatSubtitle?.call(this, album) ?? artist?.name ?? compilationKeyword}
			trailing={<AlbumContextualMenu album={album} />}
		/>
	);
};

export default AlbumItem;
