import type { SongWithRelations } from "@/models/song";
import formatArtists from "@/utils/format-artists";
import type { ComponentProps } from "react";
import { ListItem } from "..";

type Props = {
	song:
		| SongWithRelations<"illustration" | "artist" | "featuring">
		| undefined;
	illustrationProps: ComponentProps<typeof ListItem>["illustrationProps"];
};

export const SongItem = ({ song, illustrationProps }: Props) => {
	return (
		<ListItem
			title={song?.name}
			subtitle={
				song === undefined
					? undefined
					: formatArtists(song.artist, song.featuring)
			}
			onPress={() => {}} // TODO Launch playback
			illustration={song?.illustration}
			illustrationProps={illustrationProps}
		/>
	);
};
