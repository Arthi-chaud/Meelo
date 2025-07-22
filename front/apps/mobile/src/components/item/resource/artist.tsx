import type { ArtistWithRelations } from "@/models/artist";
import type { ComponentProps } from "react";
import { ListItem } from "../list-item";
import { Tile } from "../tile";

type Props = {
	artist: ArtistWithRelations<"illustration"> | undefined;
	illustrationProps?: ComponentProps<typeof Tile>["illustrationProps"];
	onPress?: () => void;
};

export const ArtistTile = ({ artist, illustrationProps, onPress }: Props) => {
	return (
		<Tile
			illustration={artist?.illustration}
			title={artist?.name}
			subtitle={null}
			onPress={onPress}
			href={artist ? `/artists/${artist.id}` : null}
			illustrationProps={{ ...illustrationProps, variant: "circle" }}
		/>
	);
};

export const ArtistItem = ({ artist, illustrationProps, onPress }: Props) => {
	return (
		<ListItem
			title={artist?.name}
			subtitle={null}
			href={artist ? `/artists/${artist.id}` : null}
			onPress={onPress}
			illustration={artist?.illustration}
			illustrationProps={{ ...illustrationProps, variant: "circle" }}
		/>
	);
};
