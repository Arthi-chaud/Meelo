import type Illustration from "@/models/illustration";
import type { Href } from "expo-router";
import type { ComponentProps } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { RequireExactlyOne } from "type-fest";
import { Illustration as IllustrationComponent } from "~/components/illustration";
import { LoadableText } from "../loadable_text";

type Props = {
	title: string | undefined;
	subtitle: string | null | undefined;
	illustration: Illustration | null | undefined;
	illustrationProps?: Omit<
		ComponentProps<typeof IllustrationComponent>,
		"illustration" | "quality"
	>;
} & RequireExactlyOne<{ href: Href; onPress: () => void }>;

export const ListItem = ({
	title,
	subtitle,
	illustration,
	...props
}: Props) => {
	return (
		<View style={styles.root}>
			<View style={styles.illustration}>
				<IllustrationComponent
					illustration={illustration}
					{...props.illustrationProps}
					variant="center"
					quality="low"
				/>
			</View>
			<View style={styles.textContainer}>
				<LoadableText
					content={title}
					skeletonWidth={15}
					variant="h6"
					numberOfLines={1}
					style={{ flex: 1 }}
				/>
				{subtitle !== null && (
					<LoadableText
						content={subtitle}
						skeletonWidth={10}
						numberOfLines={1}
					/>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		display: "flex",
		flexDirection: "row",
		flex: 1,
		width: "100%",
		justifyContent: "flex-start",
		gap: theme.gap(2),
		padding: theme.gap(1),
	},
	illustration: {
		aspectRatio: 1,
		width: 56,
	},
	textContainer: {
		display: "flex",
		flex: 1,
		justifyContent: "center",
		gap: theme.gap(1),
	},
}));
