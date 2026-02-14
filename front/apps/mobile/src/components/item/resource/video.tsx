import { type ComponentProps, useMemo } from "react";
import type { VideoWithRelations } from "@/models/video";
import formatDuration from "@/utils/format-duration";
import { useVideoContextMenu } from "~/components/context-menu/resource/video";
import { ListItem } from "../list-item";
import { Tile } from "../tile";

type Props = {
	illustrationProps?: ComponentProps<typeof Tile>["illustrationProps"];
	formatSubtitle?: (s: string) => string;
	onPress: () => void;
	video: VideoWithRelations<"illustration" | "master" | "artist"> | undefined;
	subtitle: "duration" | "artistName";
};
export const VideoTile = (props: Props) => {
	const formattedSubtitle = useFormattedSubtitle(props);
	const contextMenu = useVideoContextMenu(props.video);
	return (
		<Tile
			illustration={props.video?.illustration}
			illustrationProps={props.illustrationProps}
			title={props.video?.name}
			onPress={props.onPress}
			contextMenu={contextMenu}
			subtitle={formattedSubtitle}
		/>
	);
};

export const VideoItem = (props: Props) => {
	const formattedSubtitle = useFormattedSubtitle(props);
	const contextMenu = useVideoContextMenu(props.video);
	return (
		<ListItem
			title={props.video?.name}
			subtitle={formattedSubtitle}
			onPress={props.onPress}
			illustration={props.video?.illustration}
			contextMenu={contextMenu}
			illustrationProps={props.illustrationProps}
		/>
	);
};

const useFormattedSubtitle = ({ formatSubtitle, video, subtitle }: Props) => {
	return useMemo(() => {
		const f = formatSubtitle ?? ((e: string) => e);
		if (video === undefined) {
			return undefined;
		}
		if (subtitle === "duration") {
			return f(formatDuration(video.master.duration));
		}
		if (subtitle === "artistName") {
			return f(video.artist.name);
		}
		return null;
	}, [subtitle, formatSubtitle, video]);
};
