import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ArtistWithRelations } from "@/models/artist";
import type IllustrationResource from "@/models/illustration";
import type { SongWithRelations } from "@/models/song";
import formatArtists from "@/utils/format-artists";
import { Illustration } from "./illustration";
import { LoadableText } from "./loadable_text";

export const SongHeader = ({
	song,
}: {
	song:
		| SongWithRelations<"illustration" | "artist" | "featuring">
		| undefined;
}) => (
	<ResourceHeader
		illustration={song?.illustration}
		title={song?.name}
		subtitle={song ? formatArtists(song.artist, song.featuring) : undefined}
	/>
);

export const ArtistHeader = ({
	artist,
}: {
	artist: ArtistWithRelations<"illustration"> | undefined;
}) => (
	<ResourceHeader
		illustration={artist?.illustration}
		circleIllustration
		title={artist?.name}
		subtitle={null}
	/>
);

type Props = {
	illustration: IllustrationResource | null | undefined;
	circleIllustration?: true;
	title: string | undefined;
	subtitle: string | undefined | null;
};

export const ResourceHeader = ({
	illustration,
	title,
	circleIllustration,
	subtitle,
}: Props) => {
	return (
		<View style={styles.root}>
			<View style={styles.avatar}>
				<Illustration
					illustration={illustration}
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
		flex: 1,
		aspectRatio: 1,
	},
	text: {
		flex: { xs: 2, sm: 3, md: 5, xl: 12 },
		gap: theme.gap(2),
	},
}));
