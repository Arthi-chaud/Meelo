import type IllustrationModel from "@/models/illustration";
import { type Href, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { RequireAtLeastOne } from "type-fest";
import { useContextMenu } from "~/components/context-menu";
import type { ContextMenuProps } from "~/components/context-menu";
import { Illustration } from "~/components/illustration";
import { LoadableText } from "~/components/loadable_text";

const styles = StyleSheet.create((theme) => ({
	container: {
		padding: theme.gap(0.5),
		height: "auto",
		width: "100%",
		borderRadius: theme.borderRadius,
		overflow: "hidden",
	},
	imageContainer: {
		variants: {
			normalizedThumbnail: {
				true: { aspectRatio: 16 / 9 },
				false: { aspectRatio: 1 },
			},
		},
	},
	textColumn: {
		display: "flex",
		flexDirection: "column",
		paddingHorizontal: theme.gap(0.5),
		paddingVertical: theme.gap(1),
		gap: theme.gap(0.5),
		variants: {
			normalizedThumbnail: {
				true: {},
				false: {},
			},
			hasSubtitle: {
				true: { alignItems: "flex-start" },
				false: { alignItems: "center" },
			},
		},
	},
}));

type Props = {
	illustration: IllustrationModel | null | undefined;
	illustrationProps?: Omit<
		ComponentProps<typeof Illustration>,
		"illustration" | "quality"
	>;
	title: string | undefined;
	subtitle: string | undefined | null;
	containerStyle?: ViewStyle;
	contextMenu?: ContextMenuProps;
} & RequireAtLeastOne<{ href: Href | null; onPress: (() => void) | null }>;

export const Tile = ({
	illustration,
	title,
	subtitle,
	href,
	onPress,
	contextMenu,
	...props
}: Props) => {
	const { openContextMenu } = useContextMenu(contextMenu);
	styles.useVariants({
		hasSubtitle: subtitle !== null,
		normalizedThumbnail:
			props.illustrationProps?.normalizedThumbnail ?? false,
	});
	const router = useRouter();
	return (
		<Pressable
			onPress={() => {
				onPress?.();
				if (href) {
					router.push(href);
				}
			}}
			onLongPress={openContextMenu}
			style={[styles.container, props.containerStyle]}
		>
			<View style={styles.imageContainer}>
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
