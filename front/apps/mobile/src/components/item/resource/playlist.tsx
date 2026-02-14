import type { PlaylistWithRelations } from "@/models/playlist";
import { PlaylistIcon } from "@/ui/icons";
import { usePlaylistContextMenu } from "~/components/context-menu/resource/playlist";
import { ListItem } from "../list-item";
import { Tile } from "../tile";

type Props = {
	playlist: PlaylistWithRelations<"illustration"> | undefined;
	// Override the navigation callback
	onPress?: () => void;
};

export const PlaylistTile = ({ playlist, onPress }: Props) => {
	const contextMenu = usePlaylistContextMenu(playlist);
	return (
		<Tile
			title={playlist?.name}
			href={playlist && !onPress ? `/playlists/${playlist?.id}` : null}
			onPress={onPress}
			contextMenu={contextMenu}
			subtitle={null}
			illustration={playlist?.illustration}
			illustrationProps={{ fallbackIcon: PlaylistIcon }}
		/>
	);
};

export const PlaylistItem = ({ playlist, onPress }: Props) => {
	const contextMenu = usePlaylistContextMenu(playlist);
	return (
		<ListItem
			title={playlist?.name}
			href={playlist && !onPress ? `/playlists/${playlist?.id}` : null}
			onPress={onPress}
			contextMenu={contextMenu}
			subtitle={null}
			illustration={playlist?.illustration}
			illustrationProps={{ fallbackIcon: PlaylistIcon }}
		/>
	);
};
