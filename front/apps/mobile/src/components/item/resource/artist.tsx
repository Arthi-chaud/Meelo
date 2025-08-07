import type { ComponentProps } from "react";
import type { ArtistWithRelations } from "@/models/artist";
import { useArtistContextMenu } from "~/components/context-menu/resource/artist";
import { ListItem } from "../list-item";
import { Tile } from "../tile";

type Props = {
	artist: ArtistWithRelations<"illustration"> | undefined;
	illustrationProps?: ComponentProps<typeof Tile>["illustrationProps"];
	onPress?: () => void;
};

export const ArtistTile = ({ artist, illustrationProps, onPress }: Props) => {
	const ctxtMenu = useArtistContextMenu(artist);
	return (
		<Tile
			illustration={artist?.illustration}
			title={artist?.name}
			subtitle={null}
			onPress={onPress}
			contextMenu={ctxtMenu}
			href={artist ? `/artists/${artist.id}` : null}
			illustrationProps={{
				...illustrationProps,
				variant: "circle",
			}}
		/>
	);
};

export const ArtistItem = ({ artist, illustrationProps, onPress }: Props) => {
	const ctxtMenu = useArtistContextMenu(artist);
	return (
		<ListItem
			title={artist?.name}
			subtitle={null}
			href={artist ? `/artists/${artist.id}` : null}
			contextMenu={ctxtMenu}
			onPress={onPress}
			illustration={artist?.illustration}
			illustrationProps={{
				...illustrationProps,
				variant: "circle",
			}}
		/>
	);
};
