import { useQuery } from "react-query";
import { RequireExactlyOne } from "type-fest";
import API from "../../api";
import { AlbumWithArtist } from "../../models/album";
import { prepareMeeloQuery } from "../../query";
import AlbumContextualMenu from "../contextual-menu/album-contextual-menu";
import Illustration from "../illustration";
import { WideLoadingComponent } from "../loading/loading";
import RelationPageHeader from "./relation-page-header";

type AlbumRelationPageHeaderProps = RequireExactlyOne<{
	albumSlugOrId: number | string;
	album: AlbumWithArtist;
}>

const albumQuery = (albumSlugOrId: number | string) => ({
	key: ["album", albumSlugOrId],
	exec: () => API.getAlbum<AlbumWithArtist>(albumSlugOrId, ['artist'])
});

const AlbumRelationPageHeader = (props: AlbumRelationPageHeaderProps) => {
	const album = useQuery(prepareMeeloQuery(albumQuery, props.albumSlugOrId));

	if (props.album) {
		album.data = props.album;
	}
	if (!album.data) {
		return <WideLoadingComponent/>;
	}
	return <RelationPageHeader
		illustration={<Illustration url={album.data.illustration}/>}
		title={album.data.name}
		secondTitle={album.data.artist?.name}
		trailing={<AlbumContextualMenu album={album.data}/>}
	/>;
};

export default AlbumRelationPageHeader;
