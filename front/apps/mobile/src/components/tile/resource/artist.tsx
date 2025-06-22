import type { ArtistWithRelations } from "@/models/artist";
import { Tile } from "..";

type Props = {
	artist: ArtistWithRelations<"illustration"> | undefined;
};

export const ArtistTile = ({ artist }: Props) => {
	return (
		<Tile
			illustration={artist?.illustration}
			title={artist?.name}
			subtitle={null}
			href={`/artists/${artist?.id}`}
			illustrationProps={{ variant: "circle" }}
		/>
	);
};
