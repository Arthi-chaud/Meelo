import { RequireExactlyOne } from "type-fest";
import API from "../../api/api";
import Artist from "../../models/artist";
import { useQuery } from "../../api/use-query";
import ArtistContextualMenu from "../contextual-menu/artist-contextual-menu";
import { WideLoadingComponent } from "../loading/loading";
import RelationPageHeader from "./relation-page-header";
import ArtistAvatar from "../artist-avatar";

type ArtistRelationPageHeaderProps = RequireExactlyOne<{
	artistSlugOrId: number | string;
	artist: Artist
}>

const ArtistRelationPageHeader = (props: ArtistRelationPageHeaderProps) => {
	const artist = useQuery((id) => API.getArtist(id), props.artistSlugOrId);
	const artistData = props.artist ?? artist.data;

	if (!artistData) {
		return <WideLoadingComponent/>;
	}
	return <RelationPageHeader
		illustration={<ArtistAvatar artist={artistData}/>}
		title={artistData.name}
		trailing={<ArtistContextualMenu artist={artistData}/>}
	/>;
};

export default ArtistRelationPageHeader;
