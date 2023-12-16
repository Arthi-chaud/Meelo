import { translate } from "../../i18n/translate";
import { AlbumWithRelations } from "../../models/album";
import getYear from "../../utils/getYear";
import HighlightCard from "./highlight-card";

type AlbumHighlightCardProps = {
	album: AlbumWithRelations<"artist" | "externalIds" | "genres">;
};
const AlbumHighlightCard = ({ album }: AlbumHighlightCardProps) => {
	return (
		<HighlightCard
			title={album.name}
			headline={album.name}
			body={
				album.externalIds
					.map((id) => id.description)
					.filter((desc): desc is string => desc !== null)
					.sort((descA, descB) => descA.length - descB.length)
					.at(0) ??
				[
					album.artist?.name ?? translate("compilation"),
					getYear(album.releaseDate),
				]
					.filter((elem) => elem != null)
					.join(" - ")
			}
			tags={album.genres.map(({ name, slug }) => ({
				label: name,
				href: `/genres/${slug}`,
			}))}
			illustration={album.illustration}
			href={`/albums/${album.artist?.slug ?? "compilations"}+${
				album.slug
			}`}
		/>
	);
};

export default AlbumHighlightCard;
