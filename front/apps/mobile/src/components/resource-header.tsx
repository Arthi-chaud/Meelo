import type { ComponentProps } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ArtistWithRelations } from "@/models/artist";
import type IllustrationResource from "@/models/illustration";
import type { SongWithRelations } from "@/models/song";
import formatArtists from "@/utils/format-artists";
import { type ContextMenuBuilder, ContextMenuButton } from "./context-menu";
import { useArtistContextMenu } from "./context-menu/resource/artist";
import { useSongContextMenu } from "./context-menu/resource/song";
import { Illustration } from "./illustration";
import { LoadableText } from "./loadable_text";

export const SongHeader = ({
	song,
}: {
	song:
		| SongWithRelations<"illustration" | "artist" | "featuring" | "master">
		| undefined;
}) => {
	const contextMenu = useSongContextMenu(song);
	return (
		<ResourceHeader
			illustration={song?.illustration}
			title={song?.name}
			contextMenu={contextMenu}
			subtitle={
				song ? formatArtists(song.artist, song.featuring) : undefined
			}
		/>
	);
};

export const ArtistHeader = ({
	artist,
}: {
	artist: ArtistWithRelations<"illustration"> | undefined;
}) => {
	const contextMenu = useArtistContextMenu(artist);
	return (
		<ResourceHeader
			illustration={artist?.illustration}
			circleIllustration
			title={artist?.name}
			subtitle={null}
			contextMenu={contextMenu}
		/>
	);
};

type Props = {
	illustration: IllustrationResource | null | undefined;
	circleIllustration?: true;
	illustrationProps?: Partial<ComponentProps<typeof Illustration>>;
	title: string | undefined;
	contextMenu?: ContextMenuBuilder;
	subtitle: string | undefined | null;
};

export const ResourceHeader = ({
	illustration,
	title,
	circleIllustration,
	illustrationProps,
	contextMenu,
	subtitle,
}: Props) => {
	return (
		<View style={styles.root}>
			<View style={styles.avatar}>
				<Illustration
					illustration={illustration}
					{...illustrationProps}
					quality="medium"
					variant={circleIllustration ? "circle" : "center"}
					useBlurhash
				/>
			</View>
			<View style={styles.text}>
				<LoadableText
					content={title}
					skeletonWidth={10}
					numberOfLines={2}
					variant={subtitle !== null ? "h3" : "h2"}
				/>
				{subtitle !== null && (
					<LoadableText
						content={subtitle}
						skeletonWidth={10}
						numberOfLines={1}
						variant="h5"
					/>
				)}
			</View>
			{contextMenu && <ContextMenuButton builder={contextMenu} />}
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		padding: theme.gap(2),
		gap: theme.gap(3),
		display: "flex",
	},
	avatar: {
		width: "100%",
		maxWidth: 150, //arbitrary
		aspectRatio: 1,
	},
	text: {
		flex: { xs: 2, sm: 3, md: 5, xl: 12 },
		gap: theme.gap(2),
	},
}));
