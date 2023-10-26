import Artist from "../../models/artist";
import Illustration from '../illustration';
import ListItem from "./item";
import { ArtistIcon } from "../icons";
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
				illustration={artist.illustration}
				imgProps={{ objectFit: "cover" }}
				quality="low"
				fallback={<ArtistIcon/>}/>
			}
			href={`/artists/${artist.slug}`}
			title={artist.name}
			trailing={<ArtistContextualMenu artist={artist}/>}
		/>
	);
};

export default ArtistItem;
