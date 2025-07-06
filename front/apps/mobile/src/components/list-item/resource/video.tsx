import type { VideoWithRelations } from "@/models/video";
import type { ComponentProps } from "react";
import { ListItem } from "..";

type Props = {
	video: VideoWithRelations<"illustration" | "artist"> | undefined;
	illustrationProps: ComponentProps<typeof ListItem>["illustrationProps"];
	//TODO subtitle
};

export const VideoItem = ({ video, illustrationProps }: Props) => {
	return (
		<ListItem
			title={video?.name}
			subtitle={video ? (video.artist?.name ?? null) : undefined}
			onPress={() => {}} // TODO Launch playback
			illustration={video?.illustration}
			illustrationProps={illustrationProps}
		/>
	);
};
