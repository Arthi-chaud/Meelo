import type IllustrationModel from "@/models/illustration";
import { ContextualMenuIcon } from "@/ui/icons";
import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { type ComponentProps, Fragment, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Action } from "~/actions";
import { Divider } from "~/primitives/divider";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { Text } from "~/primitives/text";
import { useModal } from "../bottom-modal-sheet";
import { Illustration } from "../illustration";
import { LoadableText } from "../loadable_text";

export type ContextMenuItem = Action;

export type ContextMenuHeader = {
	illustration: IllustrationModel | null | undefined;
	illustrationProps?: Omit<
		ComponentProps<typeof Illustration>,
		"illustration" | "quality"
	>;
	title: string | undefined;
	subtitle: string | undefined | null;
};

export type ContextMenuProps = {
	items: ContextMenuItem[][];
	header: ContextMenuHeader;
};

// Hook to open context menu
export const useContextMenu = (props: ContextMenuProps | undefined) => {
	const content = useCallback(() => {
		if (!props) {
			return null;
		}
		return <ContextMenuModal {...props} />;
	}, [props]);
	const { openModal } = useModal({
		content,
		onDismiss: () => {},
	});
	return { openContextMenu: openModal };
};

// Button that allows opening the modal
export const ContextMenuButton = (props: ContextMenuProps) => {
	const { openContextMenu } = useContextMenu(props);

	return (
		<Pressable onPress={openContextMenu} style={styles.button}>
			<Icon icon={ContextualMenuIcon} />
		</Pressable>
	);
};

// The content of the context menu modal
export const ContextMenuModal = (content: ContextMenuProps) => {
	return (
		<>
			{content && <ContextMenuHeader header={content.header} />}
			<View style={styles.items}>
				{content?.items.map((itemGroup, itemGroupIdx) => (
					<Fragment key={itemGroupIdx}>
						<Divider h boxProps={{ style: styles.thickDivider }} />
						{itemGroup.map((item, idx) => (
							<Fragment key={item.label}>
								<ContextMenuItemComponent item={item} />
								{idx !== itemGroup.length - 1 && <Divider h />}
							</Fragment>
						))}
					</Fragment>
				))}
			</View>
		</>
	);
};

const ContextMenuHeader = ({ header }: { header: ContextMenuHeader }) => {
	return (
		<View style={styles.header}>
			<View style={styles.headerIllustration}>
				<Illustration
					illustration={header.illustration}
					quality="low"
					{...header.illustrationProps}
				/>
			</View>
			<View style={styles.headerText}>
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
			onPress={() => {
				dismiss();
				if (item.href) {
					router.push(item.href);
				}
				item.onPress?.();
			}}
		>
			<View style={styles.itemIcon}>
				<Icon icon={item.icon} />
			</View>
			<View style={styles.itemLabel}>
				<Text content={t(item.label)} variant="subtitle" />
			</View>
		</Pressable>
	);
};

const styles = StyleSheet.create((theme) => ({
	thickDivider: { height: 2 },
	items: {},
	item: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
		paddingVertical: theme.gap(1),
	},
	itemIcon: { aspectRatio: 1, alignItems: "center" },
	itemLabel: { width: "100%" },
	header: {
		flexDirection: "row",
		gap: theme.gap(2),
		paddingBottom: theme.gap(1.5),
	},
	headerIllustration: { width: theme.gap(7) },
	headerText: {
		justifyContent: "space-evenly",
		flex: 1,
	},

	button: {
		transform: [{ rotate: "90deg" }],
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
}));
