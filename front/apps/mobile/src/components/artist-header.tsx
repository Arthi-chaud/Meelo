import type { ArtistWithRelations } from "@/models/artist";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Illustration } from "./illustration";
import { LoadableText } from "./loadable_text";

type Props = { artist: ArtistWithRelations<"illustration"> | undefined };

// TODO Handle wrap when the artist name is a single word and is larger than view

export const ArtistHeader = ({ artist }: Props) => {
	return (
		<View style={styles.root}>
			<View style={styles.avatar}>
				<Illustration
					illustration={artist?.illustration}
					quality="medium"
					variant="circle"
				/>
			</View>
			<View style={styles.text}>
				<LoadableText
					content={artist?.name}
					skeletonWidth={10}
					numberOfLines={2}
					variant="h2"
				/>
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
	},
}));
