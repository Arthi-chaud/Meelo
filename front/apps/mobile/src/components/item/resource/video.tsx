import type { VideoWithRelations } from "@/models/video";
import formatDuration from "@/utils/format-duration";
import { type ComponentProps, useMemo } from "react";
import { ListItem } from "../list-item";
import { Tile } from "../tile";
type Props = {
	illustrationProps?: ComponentProps<typeof Tile>["illustrationProps"];
	formatSubtitle?: (s: string) => string;
	onPress?: () => void;
} & (
	| {
			subtitle: "duration";
			video: VideoWithRelations<"illustration" | "master"> | undefined;
	  }
	| {
			subtitle: "artistName";

			video: VideoWithRelations<"artist" | "illustration"> | undefined;
	  }
);

export const VideoTile = (props: Props) => {
	const formattedSubtitle = useFormattedSubtitle(props);
	return (
		<Tile
			illustration={props.video?.illustration}
			illustrationProps={props.illustrationProps}
			title={props.video?.name}
			onPress={() => {
				props.onPress?.();
			}} // TODO Launch playback
			subtitle={formattedSubtitle}
		/>
	);
};

export const VideoItem = (props: Props) => {
	const formattedSubtitle = useFormattedSubtitle(props);
	return (
		<ListItem
			title={props.video?.name}
			subtitle={formattedSubtitle}
			onPress={() => {
				props.onPress?.();
			}} // TODO Launch playback
			illustration={props.video?.illustration}
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
