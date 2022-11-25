import Artist from "../../models/artist";
import Illustration from '../illustration';
import ListItem from "./item";
import AccountCircle from "@mui/icons-material/AccountCircle";
import ArtistContextualMenu from "../contextual-menu/artist-contextual-menu";

type ArtistItemProps = {
	artist: Artist;
}

/**
 * Item for a list of albums
 * @param props
 * @returns
 */
const ArtistItem = ({ artist }: ArtistItemProps) => {
	return (
		<ListItem
			icon={<Illustration
				url={artist.illustration}
				style={{ objectFit: "cover" }}
				fallback={<AccountCircle/>}/>
			}
			href={`/artists/${artist.slug}`}
			title={artist.name}
			trailing={<ArtistContextualMenu artist={artist}/>}
		/>
	);
};

export default ArtistItem;
