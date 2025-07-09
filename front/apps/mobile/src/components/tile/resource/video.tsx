import type { VideoWithRelations } from "@/models/video";
import formatDuration from "@/utils/format-duration";
import type { ComponentProps } from "react";
import { Tile } from "..";
type Props = {
	illustrationProps?: ComponentProps<typeof Tile>["illustrationProps"];
} & (
	| {
			subtitle: "duration";
			video:
				| VideoWithRelations<"artist" | "illustration" | "master">
				| undefined;
	  }
	| {
			subtitle: "artistName";

			video: VideoWithRelations<"artist" | "illustration"> | undefined;
	  }
);

export const VideoTile = ({ video, illustrationProps, subtitle }: Props) => {
	return (
		<Tile
			illustration={video?.illustration}
			illustrationProps={illustrationProps}
			title={video?.name}
			onPress={() => {}} // TODO
			subtitle={
				subtitle === "artistName"
					? video?.artist.name
					: video
						? formatDuration(video.master.duration)
						: undefined
			}
		/>
	);
};
