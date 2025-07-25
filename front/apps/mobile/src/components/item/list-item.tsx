import type Illustration from "@/models/illustration";
import { type Href, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { RequireAtLeastOne } from "type-fest";
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
} & RequireAtLeastOne<{ href: Href | null; onPress: (() => void) | null }>;

//TODO Ripple or visual feedback on press

export const ListItem = ({
	title,
	subtitle,
	illustration,
	illustrationProps,
	href,
	onPress,
}: Props) => {
	const router = useRouter();
	styles.useVariants({
		normalizedThumbnail: illustrationProps?.normalizedThumbnail ?? false,
	});
	return (
		<Pressable
			onPress={() => {
				onPress?.();
				if (href) {
					router.push(href);
				}
			}}
			style={[styles.root]}
		>
			<View style={styles.illustration}>
				<IllustrationComponent
					illustration={illustration}
					{...illustrationProps}
					variant={illustrationProps?.variant ?? "center"}
					quality="low"
				/>
			</View>
			<View style={styles.textContainer}>
				<LoadableText
					content={title}
					skeletonWidth={15}
					variant="h6"
					numberOfLines={1}
				/>
				{subtitle !== null && (
					<LoadableText
						content={subtitle}
						skeletonWidth={10}
						variant="body"
						numberOfLines={1}
					/>
				)}
			</View>
		</Pressable>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		display: "flex",
		flexDirection: "row",
		borderRadius: theme.borderRadius,
		overflow: "hidden",
		width: "100%",
		justifyContent: "flex-start",
		gap: theme.gap(2),
		padding: theme.gap(1),
	},
	illustration: {
		variants: {
			normalizedThumbnail: {
				false: {
					aspectRatio: 1,
					width: 56,
				},
				true: {
					marginTop: theme.gap(0.5),
					marginBottom: theme.gap(0.5),
					aspectRatio: 16 / 9,
					width: 80,
				},
			},
		},
	},
	textContainer: {
		display: "flex",
		flex: 1,
		justifyContent: "center",
		gap: theme.gap(1),
	},
}));
