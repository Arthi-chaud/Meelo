import type { ArtistWithRelations } from "@/models/artist";
import type { ComponentProps } from "react";
import { ListItem } from "..";

type Props = {
	artist: ArtistWithRelations<"illustration"> | undefined;
	illustrationProps: ComponentProps<typeof ListItem>["illustrationProps"];
	onPress?: () => void;
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
