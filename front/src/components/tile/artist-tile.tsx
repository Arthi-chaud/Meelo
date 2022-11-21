import Artist from "../../models/artist";
import { AccountCircle } from "@mui/icons-material";
import Tile from "./tile";
import Illustration from "../illustration";

const ArtistTile = (props: { artist: Artist }) => {
	return <Tile
		title={props.artist.name}
		targetURL={`/artists/${props.artist.slug}`}
		illustration={<Illustration url={props.artist.illustration} style={{ objectFit: "cover" }} fallback={<AccountCircle />}/>}
	/>;
};

export default ArtistTile;
