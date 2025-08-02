import type { ComponentProps } from "react";
import type { TrackWithRelations } from "@/models/track";
import { useTrackContextMenu } from "~/components/context-menu/resource/track";
import { ListItem } from "~/components/item/list-item";

type Props = {
	track:
		| TrackWithRelations<"illustration" | "release" | "song" | "video">
		| undefined;
	illustrationProps: ComponentProps<typeof ListItem>["illustrationProps"];
};

export const TrackItem = ({ track, illustrationProps }: Props) => {
	const contextMenu = useTrackContextMenu(track);
	return (
		<ListItem
			title={track?.name}
			onPress={() => {}}
			subtitle={track?.release?.name}
			illustration={track?.illustration}
			contextMenu={contextMenu}
			illustrationProps={illustrationProps}
		/>
	);
};
