import type { VideoWithRelations } from "@/models/video";
import formatDuration from "@/utils/format-duration";
import { type ComponentProps, useMemo } from "react";
import { ListItem } from "..";

type Props = {
	illustrationProps: ComponentProps<typeof ListItem>["illustrationProps"];
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

export const VideoItem = ({
	video,
	illustrationProps,
	subtitle,
	formatSubtitle,
	onPress,
}: Props) => {
	const formattedSubtitle = useMemo(() => {
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
	return (
		<ListItem
			title={video?.name}
			subtitle={formattedSubtitle}
			onPress={() => {
				onPress?.();
			}} // TODO Launch playback
			illustration={video?.illustration}
			illustrationProps={illustrationProps}
		/>
	);
};
