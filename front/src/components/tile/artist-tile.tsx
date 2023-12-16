import Artist from "../../models/artist";
import Tile from "./tile";
import ArtistContextualMenu from "../contextual-menu/artist-contextual-menu";
import ArtistAvatar from "../artist-avatar";
import { Box } from "@mui/material";

const ArtistTile = (props: { artist: Artist }) => {
	return (
		<Tile
			cardProps={{ sx: { background: "none", boxShadow: "none" } }}
			contextualMenu={<ArtistContextualMenu artist={props.artist} />}
			title={props.artist.name}
			href={`/artists/${props.artist.slug}`}
			illustration={
				<Box sx={{ padding: 1 }}>
					<ArtistAvatar artist={props.artist} quality="med" />
				</Box>
			}
		/>
	);
};

export default ArtistTile;
