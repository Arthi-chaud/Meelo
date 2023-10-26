import { ArtistIcon } from "../icons";
import { RequireExactlyOne } from "type-fest";
import API from "../../api/api";
import Artist from "../../models/artist";
import { useQuery } from "../../api/use-query";
import ArtistContextualMenu from "../contextual-menu/artist-contextual-menu";
import Illustration from "../illustration";
import { WideLoadingComponent } from "../loading/loading";
import RelationPageHeader from "./relation-page-header";

type ArtistRelationPageHeaderProps = RequireExactlyOne<{
	artistSlugOrId: number | string;
	artist: Artist
}>

const ArtistRelationPageHeader = (props: ArtistRelationPageHeaderProps) => {
	const artist = useQuery((id) => API.getArtist(id, []), props.artistSlugOrId);

	if (props.artist) {
		artist.data = props.artist;
	}
	if (!artist.data) {
		return <WideLoadingComponent/>;
	}
	return <RelationPageHeader
		illustration={<Illustration imgProps={{ objectFit: "cover" }}
			illustration={artist.data.illustration}
			quality="med"
			fallback={<ArtistIcon/>}/>
		}
		title={artist.data.name}
		trailing={<ArtistContextualMenu artist={artist.data}/>}
	/>;
};

export default ArtistRelationPageHeader;
