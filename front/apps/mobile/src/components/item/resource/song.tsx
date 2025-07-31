import type { SongWithRelations } from "@/models/song";
import formatArtists from "@/utils/format-artists";
import { type ComponentProps, useMemo } from "react";
import { ListItem } from "../list-item";
import { useSongContextMenu } from "~/components/context-menu/resource/song";

type Props = {
	song:
		| SongWithRelations<"illustration" | "artist" | "featuring">
		| undefined;
	illustrationProps: ComponentProps<typeof ListItem>["illustrationProps"];
	subtitle: "artists" | null | undefined;
	formatSubtitle?: (s: string) => string;
	onPress?: () => void;
};

export const SongItem = ({
	song,
	illustrationProps,
	subtitle,
	formatSubtitle,
	onPress,
}: Props) => {
	const contextMenu = useSongContextMenu(song);
	const formattedSubtitle = useMemo(() => {
		const f = formatSubtitle ?? ((e: string) => e);
		if (subtitle === null) {
			return null;
		}
		if (song === undefined) {
			return undefined;
		}
		if (subtitle === "artists") {
			return f(formatArtists(song.artist, song.featuring));
		}
		return null;
	}, [subtitle, formatSubtitle, song]);
	return (
		<ListItem
			title={song?.name}
			subtitle={formattedSubtitle}
			href={`/songs/${song?.id}`}
			onPress={() => {
				onPress?.();
			}} // TODO Launch playback
			contextMenu={contextMenu}
			illustration={song?.illustration}
			illustrationProps={illustrationProps}
		/>
	);
};
