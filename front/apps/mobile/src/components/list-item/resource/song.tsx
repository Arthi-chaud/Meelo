import type { SongWithRelations } from "@/models/song";
import formatArtists from "@/utils/format-artists";
import type { ComponentProps } from "react";
import { ListItem } from "..";

type Props = {
	song:
		| SongWithRelations<"illustration" | "artist" | "featuring">
		| undefined;
	illustrationProps: ComponentProps<typeof ListItem>["illustrationProps"];
	subtitle: "artists" | null | undefined;
};

export const SongItem = ({ song, illustrationProps, subtitle }: Props) => {
	return (
		<ListItem
			title={song?.name}
			subtitle={
				subtitle === null
					? null
					: song === undefined
						? undefined
						: subtitle === "artists"
							? formatArtists(song.artist, song.featuring)
							: null
			}
			onPress={() => {}} // TODO Launch playback
			illustration={song?.illustration}
			illustrationProps={illustrationProps}
		/>
	);
};
