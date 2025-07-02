import type { ArtistWithRelations } from "@/models/artist";
import type { ComponentProps } from "react";
import { ListItem } from "..";

type Props = {
	artist: ArtistWithRelations<"illustration"> | undefined;
	illustrationProps: ComponentProps<typeof ListItem>["illustrationProps"];
};

export const ArtistItem = ({ artist, illustrationProps }: Props) => {
	return (
		<ListItem
			title={artist?.name}
			subtitle={null}
			href={artist ? `/artists/${artist.id}` : null}
			illustration={artist?.illustration}
			illustrationProps={{ ...illustrationProps, variant: "circle" }}
		/>
	);
};
