import type { PlaylistWithRelations } from "@/models/playlist";
import { PlaylistIcon } from "@/ui/icons";
import { ListItem } from "../list-item";
import { Tile } from "../tile";

type Props = {
	playlist: PlaylistWithRelations<"illustration"> | undefined;
};

export const PlaylistTile = ({ playlist }: Props) => {
	return (
		<Tile
			title={playlist?.name}
			href={playlist ? `/playlists/${playlist?.id}` : null}
			subtitle={null}
			illustration={playlist?.illustration}
			illustrationProps={{ fallbackIcon: PlaylistIcon }}
		/>
	);
};

export const PlaylistItem = ({ playlist }: Props) => {
	return (
		<ListItem
			title={playlist?.name}
			href={playlist ? `/playlists/${playlist?.id}` : null}
			subtitle={null}
			illustration={playlist?.illustration}
			illustrationProps={{ fallbackIcon: PlaylistIcon }}
		/>
	);
};
