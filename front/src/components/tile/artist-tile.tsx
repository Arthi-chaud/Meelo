import Artist from "../../models/artist";
import Tile from "./tile";
import Illustration from "../illustration";
import ArtistContextualMenu from "../contextual-menu/artist-contextual-menu";
import { ArtistIcon } from "../icons";

const ArtistTile = (props: { artist: Artist }) => {
	return <Tile
		contextualMenu={<ArtistContextualMenu artist={props.artist}/>}
		title={props.artist.name}
		href={`/artists/${props.artist.slug}`}
		illustration={<Illustration
			illustration={props.artist.illustration}
			imgProps={{ objectFit: "cover" }}
			fallback={<ArtistIcon />}
			quality="med"
		/>}
	/>;
};

export default ArtistTile;
