import Tile from "./tile";
import { AlbumWithRelations } from "../../models/album";
import Illustration from "../illustration";
import { useMemo } from "react";
import { translate, useLanguage } from "../../i18n/translate";

const AlbumTile = (props: {
	album: AlbumWithRelations<'artist'>,
	formatSubtitle?: (album: AlbumWithRelations<'artist'>) => string
}) => {
	const language = useLanguage();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const compilationKeyword = useMemo(() => translate('compilation'), [language]);

	return <Tile
		title={props.album.name}
		subtitle={props.formatSubtitle?.call(this, props.album)
			?? props.album.artist?.name
			?? compilationKeyword
		}
		href={`/albums/${props.album.artist?.slug ?? 'compilations'}+${props.album.slug}`}
		illustration={<Illustration url={props.album.illustration}/>}
	/>;
};

export default AlbumTile;
