import type { ArtistWithRelations } from "@/models/artist";
import type { ComponentProps } from "react";
import { Tile } from "..";

type Props = {
	artist: ArtistWithRelations<"illustration"> | undefined;
	illustrationProps?: ComponentProps<typeof Tile>["illustrationProps"];
};

export const ArtistTile = ({ artist, illustrationProps }: Props) => {
	return (
		<Tile
			illustration={artist?.illustration}
			title={artist?.name}
			subtitle={null}
			{...(artist === undefined
				? { onPress: () => {}, href: undefined }
				: { href: `/artists/${artist.id}`, onPress: undefined })}
			illustrationProps={{ ...illustrationProps, variant: "circle" }}
		/>
	);
};
