import Artist from "../../models/artist";
import { AccountCircle } from "@mui/icons-material";
import Tile from "./tile";
import Illustration from "../illustration";
import ArtistContextualMenu from "../contextual-menu/artist-contextual-menu";

const ArtistTile = (props: { artist: Artist }) => {
	return <Tile
		contextualMenu={<ArtistContextualMenu artist={props.artist}/>}
		title={props.artist.name}
		href={`/artists/${props.artist.slug}`}
		illustration={<Illustration url={props.artist.illustration} style={{ objectFit: "cover" }} fallback={<AccountCircle />}/>}
	/>;
};

export default ArtistTile;
