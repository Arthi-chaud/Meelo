import { type Href, useRouter } from "expo-router";
import {
	type ComponentProps,
	type ReactElement,
	type ReactNode,
	useCallback,
} from "react";
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
import * as Haptics from "~/haptics";
import { Pressable } from "~/primitives/pressable";
import { LoadableText } from "../loadable_text";

type Props = {
	title: string | undefined;
	subtitle: string | null | undefined;
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
	) &
	(
		| {
				leading: ReactNode | null;
				illustration?: never;
				illustrationProps?: never;
		  }
		| {
				leading?: never;
				illustration: Illustration | null | undefined;
				illustrationProps?: Omit<
					ComponentProps<typeof IllustrationComponent>,
					"illustration" | "quality"
				>;
		  }
	);

// By default, blurash is disabled
export const ListItem = ({
	title,
	subtitle,
	illustration,
	illustrationProps,
	leading,
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
		hasIllustration: leading === undefined,
	});
	const onLongPressCallback = useCallback(() => {
		if (onLongPress) {
			onLongPress();
		} else if (contextMenu) {
			Haptics.onContextMenuOpen();
			openContextMenu();
		}
	}, [onLongPress, contextMenu, openContextMenu]);
	return (
		<Pressable
			onPress={() => {
				onPress?.();
				if (href) {
					router.navigate(href);
				}
			}}
			onLongPress={onLongPressCallback}
			style={[styles.root]}
		>
			{leading === undefined ? (
				<View style={styles.illustration}>
					<IllustrationComponent
						{...illustrationProps}
						illustration={illustration}
						useBlurhash={illustrationProps?.useBlurhash ?? false}
						variant={illustrationProps?.variant ?? "center"}
						quality="low"
					/>
				</View>
			) : leading !== null ? (
				<View style={styles.illustration}>{leading}</View>
			) : null}
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
		variants: {
			hasIllustration: {
				true: {},
				false: { minHeight: theme.gap(6) },
			},
		},
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

		variants: {
			hasIllustration: {
				true: {},
				false: { marginLeft: theme.gap(1) },
			},
		},
	},
	contextMenu: {
		justifyContent: "center",
	},
}));
