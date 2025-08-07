import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { type ComponentProps, Fragment, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type IllustrationModel from "@/models/illustration";
import { ContextualMenuIcon } from "@/ui/icons";
import type { Action } from "~/actions";
import { Divider } from "~/primitives/divider";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { Text } from "~/primitives/text";
import { useModal } from "../bottom-modal-sheet";
import { Illustration } from "../illustration";
import { LoadableText } from "../loadable_text";

export type ContextMenuItem = Action & { nestedModal?: boolean };

export type ContextMenuHeader = {
	illustration: IllustrationModel | null | undefined;
	illustrationProps?: Omit<
		ComponentProps<typeof Illustration>,
		"illustration" | "quality"
	>;
	title: string | undefined;
	subtitle: string | undefined | null;
};

export type ContextMenuBuilder = () => ContextMenu;

export type ContextMenu = {
	items: ContextMenuItem[][];
	header: ContextMenuHeader;
};

// Hook to open context menu
export const useContextMenu = (builder: ContextMenuBuilder | undefined) => {
	const content = useCallback(() => {
		const ctxMenu = builder?.();
		if (!ctxMenu) {
			return null;
		}
		return <ContextMenuModal {...ctxMenu} />;
	}, [builder]);
	const { openModal } = useModal({
		content,
		onDismiss: () => {},
	});
	return { openContextMenu: openModal };
};

// Button that allows opening the modal
export const ContextMenuButton = (props: { builder: ContextMenuBuilder }) => {
	const { openContextMenu } = useContextMenu(props.builder);

	return (
		<Pressable onPress={openContextMenu} style={styles.button}>
			<Icon icon={ContextualMenuIcon} />
		</Pressable>
	);
};

// The content of the context menu modal
export const ContextMenuModal = (content: ContextMenu) => {
	return (
		<>
			{content && <ContextMenuHeader header={content.header} />}
			<View style={styles.items}>
				{content?.items.map((itemGroup, itemGroupIdx) => (
					<Fragment key={itemGroupIdx}>
						<Divider h boxProps={{ style: styles.thickDivider }} />
						{itemGroup.length > 0 &&
							itemGroup.map((item, idx) => (
								<Fragment key={`${item.label}-${idx}`}>
									<ContextMenuItemComponent item={item} />
									{idx !== itemGroup.length - 1 && (
										<Divider h />
									)}
								</Fragment>
							))}
					</Fragment>
				))}
			</View>
		</>
	);
};

const ContextMenuHeader = ({ header }: { header: ContextMenuHeader }) => {
	const isThumbnail = header.illustrationProps?.normalizedThumbnail ?? false;
	headerStyles.useVariants({
		thumbnail: isThumbnail,
	});
	return (
		<View style={headerStyles.root}>
			<View style={headerStyles.illustration}>
				<Illustration
					illustration={header.illustration}
					quality={isThumbnail ? "medium" : "low"}
					{...(header.illustrationProps ?? {
						useBlurhash: true,
						variant: "center",
					})}
				/>
			</View>
			<View style={headerStyles.text}>
				<LoadableText
					content={header.title}
					variant="h6"
					numberOfLines={1}
					skeletonWidth={15}
				/>

				{header.subtitle !== null && (
					<LoadableText
						content={header.subtitle}
						variant="body"
						numberOfLines={1}
						skeletonWidth={10}
					/>
				)}
			</View>
		</View>
	);
};

const ContextMenuItemComponent = ({ item }: { item: ContextMenuItem }) => {
	const router = useRouter();
	const { t } = useTranslation();
	const { dismiss } = useBottomSheetModal();
	return (
		<Pressable
			key={item.label}
			style={styles.item}
			disabled={item.disabled}
			onPress={() => {
				if (item.disabled) {
					return;
				}
				if (!item.nestedModal) {
					dismiss();
				}
				if (item.href) {
					router.push(item.href);
				}
				item.onPress?.();
			}}
		>
			<View style={styles.itemIcon}>
				<Icon
					icon={item.icon}
					style={item.disabled ? styles.disabled : undefined}
				/>
			</View>
			<View style={styles.itemLabel}>
				<Text
					content={t(item.label)}
					variant="subtitle"
					style={item.disabled ? styles.disabled : undefined}
				/>
			</View>
		</Pressable>
	);
};

const styles = StyleSheet.create((theme) => ({
	thickDivider: { height: theme.gap(0.33) },
	items: {},
	disabled: { color: theme.colors.text.secondary },
	item: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
		paddingVertical: theme.gap(1),
	},
	itemIcon: { aspectRatio: 1, alignItems: "center" },
	itemLabel: { width: "100%" },
	button: {
		transform: [{ rotate: "90deg" }],
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
}));

const headerStyles = StyleSheet.create((theme) => ({
	root: {
		flexDirection: "row",
		gap: theme.gap(2),
		paddingBottom: theme.gap(1.5),
	},
	illustration: {
		variants: {
			thumbnail: {
				true: { width: theme.gap(10) },
				false: { width: theme.gap(7) },
			},
		},
	},

	text: {
		justifyContent: "space-evenly",
		flex: 1,
	},
}));
