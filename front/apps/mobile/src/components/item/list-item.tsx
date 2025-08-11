import { type Href, useRouter } from "expo-router";
import { type ComponentProps, type ReactElement, useCallback } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { RequireAtLeastOne } from "type-fest";
import type Illustration from "@/models/illustration";
import {
	type ContextMenuBuilder,
	ContextMenuButton,
	useContextMenu,
} from "~/components/context-menu";
import { Illustration as IllustrationComponent } from "~/components/illustration";
import { Pressable } from "~/primitives/pressable";
import { LoadableText } from "../loadable_text";

type Props = {
	title: string | undefined;
	subtitle: string | null | undefined;
	illustration: Illustration | null | undefined;
	illustrationProps?: Omit<
		ComponentProps<typeof IllustrationComponent>,
		"illustration" | "quality"
	>;
} & RequireAtLeastOne<{ href: Href | null; onPress: (() => void) | null }> &
	(
		| {
				trailing?: ReactElement;
				onLongPress?: () => void;
				contextMenu?: never;
		  }
		| {
				trailing?: never;
				onLongPress?: never;
				contextMenu?: ContextMenuBuilder;
		  }
	);

// By default, blurash is disabled
export const ListItem = ({
	title,
	subtitle,
	illustration,
	illustrationProps,
	href,
	trailing,
	contextMenu,
	onLongPress,
	onPress,
}: Props) => {
	const { openContextMenu } = useContextMenu(contextMenu);
	const router = useRouter();
	styles.useVariants({
		normalizedThumbnail: illustrationProps?.normalizedThumbnail ?? false,
	});
	const onLongPressCallback = useCallback(() => {
		if (onLongPress) {
			onLongPress();
		} else if (contextMenu) {
			openContextMenu();
		}
	}, [onLongPress, contextMenu, openContextMenu]);
	return (
		<Pressable
			onPress={() => {
				onPress?.();
				if (href) {
					router.push(href);
				}
			}}
			onLongPress={onLongPressCallback}
			style={[styles.root]}
		>
			<View style={styles.illustration}>
				<IllustrationComponent
					{...illustrationProps}
					illustration={illustration}
					useBlurhash={illustrationProps?.useBlurhash ?? false}
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
			{contextMenu ? (
				title !== undefined && (
					<View style={styles.contextMenu}>
						<ContextMenuButton builder={contextMenu} />
					</View>
				)
			) : (
				<View style={styles.contextMenu}>{trailing}</View>
			)}
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
	contextMenu: {
		justifyContent: "center",
	},
}));
