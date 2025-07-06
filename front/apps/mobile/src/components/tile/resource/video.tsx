import type { VideoWithRelations } from "@/models/video";
import type { ComponentProps } from "react";
import { Tile } from "..";

type Props = {
	video: VideoWithRelations<"artist" | "illustration"> | undefined;
	illustrationProps?: ComponentProps<typeof Tile>["illustrationProps"];
	//TODO Subtitle
};

export const VideoTile = ({ video, illustrationProps }: Props) => {
	return (
		<Tile
			illustration={video?.illustration}
			illustrationProps={{
				normalizedThumbnail: true,
				...illustrationProps,
			}}
			title={video?.name}
			onPress={() => {}} // TODO
			subtitle={video?.artist.name}
		/>
	);
};
