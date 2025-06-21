import type IllustrationModel from "@/models/illustration";
import { View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Illustration } from "~/components/illustration";
import { LoadableText } from "~/components/loadable_text";

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		padding: theme.gap(0.5),
	},
	textColumn: {
		display: "flex",
		flexDirection: "column",
		justifyContent: "space-between",
		padding: theme.gap(0.5),
		paddingBottom: theme.gap(0.25),
		gap: theme.gap(0.25),
	},
}));

// TODO: Href/onClick
// Illustration: Button animation

type Props = {
	illustration: IllustrationModel | null | undefined;
	title: string | undefined;
	subtitle: string | undefined;
	containerStyle?: ViewStyle;
};

export const Tile = ({ illustration, title, subtitle, ...props }: Props) => {
	return (
		<View style={[styles.container, props.containerStyle]}>
			<Illustration illustration={illustration} />
			<View style={styles.textColumn}>
				<LoadableText
					variant="h6"
					numberOfLines={1}
					skeletonWidth={10}
					content={title}
				/>
				<LoadableText
					variant="body"
					style={{}}
					skeletonWidth={8}
					numberOfLines={1}
					content={subtitle}
				/>
			</View>
		</View>
	);
};
