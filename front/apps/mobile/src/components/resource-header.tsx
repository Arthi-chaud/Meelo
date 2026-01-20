import { type ComponentProps, useLayoutEffect, useRef, useState } from "react";
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
			vertical
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
	vertical?: boolean;
};

export const ResourceHeader = ({
	illustration,
	title,
	circleIllustration,
	illustrationProps,
	contextMenu,
	subtitle,
	vertical,
}: Props) => {
	vertical ??= false;
	styles.useVariants({ vertical });
	const gutterRef = useRef<View>(null);
	const [gutterWidth, setGutterWidth] = useState(0);
	useLayoutEffect(() => {
		gutterRef.current?.measure((_, __, width) => setGutterWidth(width));
	}, [setGutterWidth, title, contextMenu]);
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
			<View style={styles.secondary}>
				{contextMenu && vertical && (
					<View style={{ width: gutterWidth }} />
				)}
				<View style={styles.texts}>
					<LoadableText
						content={title}
						skeletonWidth={10}
						numberOfLines={2}
						style={styles.text}
						variant={subtitle !== null ? "h3" : "h2"}
					/>
					{subtitle !== null && (
						<LoadableText
							content={subtitle}
							skeletonWidth={10}
							style={styles.text}
							numberOfLines={1}
							variant="h5"
						/>
					)}
				</View>
				<View ref={gutterRef}>
					{contextMenu && title && (
						<ContextMenuButton builder={contextMenu} />
					)}
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		padding: theme.gap(2),
		gap: theme.gap(3),
		width: "100%",
		variants: {
			vertical: {
				true: {
					flexDirection: "column",
					alignItems: "center",
					paddingVertical: theme.gap(3.5),
				},
				false: {
					flexDirection: "row",
					alignItems: "center",
				},
			},
		},
	},
	avatar: {
		width: 120, //arbitrary
		aspectRatio: 1,
		variants: {
			vertical: {
				true: {},
				false: {},
			},
		},
	},
	text: {
		variants: {
			vertical: {
				true: { textAlign: "center" },
				false: {},
			},
		},
	},
	texts: {
		gap: theme.gap(2),
		flex: 1,
		justifyContent: "center",
		variants: {
			vertical: {
				true: { alignItems: "center" },
				false: { alignItems: "flex-start" },
			},
		},
	},
	secondary: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: theme.gap(1),
		variants: {
			vertical: {
				true: { width: "100%" },
				false: {
					flex: { xs: 2, sm: 3, md: 5, xl: 12 },
				},
			},
		},
	},
}));
