import { AccountCircle } from "@mui/icons-material";
import { Box } from "@mui/material";
import { useQuery } from "react-query";
import { RequireExactlyOne } from "type-fest";
import API from "../../api";
import Artist from "../../models/artist";
import { SongWithArtist } from "../../models/song";
import { prepareMeeloQuery } from "../../query";
import ArtistContextualMenu from "../contextual-menu/artist-contextual-menu";
import SongContextualMenu from "../contextual-menu/song-contextual-menu";
import Illustration from "../illustration";
import { WideLoadingComponent } from "../loading/loading";
import RelationPageHeader from "./relation-page-header";

type ArtistRelationPageHeaderProps = RequireExactlyOne<{
	artistSlugOrId: number | string;
	artist: Artist
}>

const artistQuery = (artistSlugOrId: number | string) => ({
	key: ["artist", artistSlugOrId],
	exec: () => API.getArtist(artistSlugOrId)
});

const ArtistRelationPageHeader = (props: ArtistRelationPageHeaderProps) => {
	const artist = useQuery(prepareMeeloQuery(artistQuery, props.artistSlugOrId));
	if (props.artist) {
		artist.data = props.artist;
	}
	if (!artist.data) {
		return <WideLoadingComponent/>
	}
	return <RelationPageHeader
		illustration={<Illustration style={{ objectFit: "cover" }} url={artist.data.illustration} fallback={<AccountCircle/>}/>}
		title={artist.data.name}
		trailing={<ArtistContextualMenu artist={artist.data}/>}
	/>
}

export default ArtistRelationPageHeader;