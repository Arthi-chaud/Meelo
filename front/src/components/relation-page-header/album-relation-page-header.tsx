import { RequireExactlyOne } from "type-fest";
import API from "../../api/api";
import { useQuery } from "../../api/use-query";
import AlbumContextualMenu from "../contextual-menu/album-contextual-menu";
import Illustration from "../illustration";
import { WideLoadingComponent } from "../loading/loading";
import RelationPageHeader from "./relation-page-header";
import { AlbumWithRelations } from "../../models/album";

type AlbumRelationPageHeaderProps = RequireExactlyOne<{
	albumSlugOrId: number | string;
	album: AlbumWithRelations<'artist'>;
}>

const AlbumRelationPageHeader = (props: AlbumRelationPageHeaderProps) => {
	const album = useQuery((id) => API.getAlbum(id, ['artist']), props.albumSlugOrId);

	if (props.album) {
		album.data = props.album;
	}
	if (!album.data) {
		return <WideLoadingComponent/>;
	}
	return <RelationPageHeader
		illustration={<Illustration illustration={album.data.illustration}/>}
		title={album.data.name}
		secondTitle={album.data.artist?.name}
		trailing={<AlbumContextualMenu album={album.data}/>}
	/>;
};

export default AlbumRelationPageHeader;
