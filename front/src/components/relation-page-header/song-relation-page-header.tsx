import { RequireExactlyOne } from "type-fest";
import API from "../../api/api";
import { SongWithRelations } from "../../models/song";
import { useQuery } from "../../api/use-query";
import SongContextualMenu from "../contextual-menu/song-contextual-menu";
import Illustration from "../illustration";
import { WideLoadingComponent } from "../loading/loading";
import RelationPageHeader from "./relation-page-header";

type SongRelationPageHeaderProps = RequireExactlyOne<{
	songSlugOrId: number | string;
	song: SongWithRelations<['artist']>
}>

const SongRelationPageHeader = (props: SongRelationPageHeaderProps) => {
	const song = useQuery((id) => API.getSong(id, ['artist']), props.songSlugOrId);

	if (props.song) {
		song.data = props.song;
	}
	if (!song.data) {
		return <WideLoadingComponent/>;
	}
	return <RelationPageHeader
		illustration={<Illustration url={song.data.illustration}/>}
		title={song.data.name}
		secondTitle={song.data.artist.name}
		trailing={<SongContextualMenu song={song.data}/>}
	/>;
};

export default SongRelationPageHeader;
