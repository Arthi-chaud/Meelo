import Artist from "../../models/artist";
import ListItem from "./item";
import ArtistContextualMenu from "../contextual-menu/artist-contextual-menu";
import ArtistAvatar from "../artist-avatar";

type ArtistItemProps = {
	artist: Artist;
};

/**
 * Item for a list of albums
 * @param props
 * @returns
 */
const ArtistItem = ({ artist }: ArtistItemProps) => {
	return (
		<ListItem
			icon={<ArtistAvatar artist={artist} quality="low" />}
			href={`/artists/${artist.slug}`}
			title={artist.name}
			trailing={<ArtistContextualMenu artist={artist} />}
		/>
	);
};

export default ArtistItem;
