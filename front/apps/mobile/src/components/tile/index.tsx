import type IllustrationModel from "@/models/illustration";
import { type Href, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { RequireExactlyOne } from "type-fest";
import { Illustration } from "~/components/illustration";
import { LoadableText } from "~/components/loadable_text";

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		padding: theme.gap(0.5),
	},
	imageContainer: {},
	textColumn: {
		display: "flex",
		flexDirection: "column",
		paddingHorizontal: theme.gap(0.5),
		paddingVertical: theme.gap(1),
		gap: theme.gap(0.5),
		variants: {
			hasSubtitle: {
				true: { alignItems: "flex-start" },
				false: { alignItems: "center" },
			},
		},
	},
}));

// TODO: Href/onClick
// Illustration: Button animation

type Props = {
	illustration: IllustrationModel | null | undefined;
	illustrationProps?: Omit<
		ComponentProps<typeof Illustration>,
		"illustration" | "quality"
	>;
	title: string | undefined;
	subtitle: string | undefined | null;
	containerStyle?: ViewStyle;
} & RequireExactlyOne<{ href: Href; onPress: () => void }>;

export const Tile = ({
	illustration,
	title,
	subtitle,
	href,
	onPress,
	...props
}: Props) => {
	styles.useVariants({ hasSubtitle: subtitle !== null });
	const router = useRouter();
	return (
		<Pressable
			onPress={() => (href ? router.push(href) : onPress())}
			style={[styles.container, props.containerStyle]}
		>
			<View>
				<Illustration
					illustration={illustration}
					{...props.illustrationProps}
					quality="medium"
				/>
			</View>
			<View style={[styles.textColumn]}>
				<LoadableText
					variant="h6"
					numberOfLines={1}
					skeletonWidth={10}
					content={title}
				/>
				{subtitle !== null && (
					<LoadableText
						variant="body"
						skeletonWidth={8}
						numberOfLines={1}
						content={subtitle}
					/>
				)}
			</View>
		</Pressable>
	);
};
