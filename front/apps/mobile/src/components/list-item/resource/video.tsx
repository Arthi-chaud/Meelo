import type { VideoWithRelations } from "@/models/video";
import formatDuration from "@/utils/format-duration";
import type { ComponentProps } from "react";
import { ListItem } from "..";

type Props = {
	illustrationProps: ComponentProps<typeof ListItem>["illustrationProps"];
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

export const VideoItem = ({ video, illustrationProps, subtitle }: Props) => {
	return (
		<ListItem
			title={video?.name}
			subtitle={
				subtitle === "artistName"
					? video?.artist.name
					: video
						? formatDuration(video.master.duration)
						: undefined
			}
			onPress={() => {}} // TODO Launch playback
			illustration={video?.illustration}
			illustrationProps={illustrationProps}
		/>
	);
};
