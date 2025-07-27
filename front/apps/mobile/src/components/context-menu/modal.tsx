import {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetModal,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import {
	Fragment,
	type RefObject,
	useCallback,
	useEffect,
	useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { contextMenuAtom } from "~/hooks/context-menu";
import type {
	ContextMenuItem,
	ContextMenuHeader as HeaderProps,
} from "~/components/context-menu/model";
import { Divider } from "~/primitives/divider";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { Text } from "~/primitives/text";
import { BlurView } from "../blur-view";
import { Illustration } from "../illustration";
import { LoadableText } from "../loadable_text";

// The modal will be mounted when 'content' is not null
export const ContextMenuModal = () => {
	const [content, setContextMenu] = useAtom(contextMenuAtom);
	const resetContextMenu = useCallback(
		() => setContextMenu(null),
		[setContextMenu],
	);
	const modalRef = useRef<BottomSheetModal>(null);

	useEffect(() => {
		if (content !== null && content !== undefined) {
			modalRef.current?.present();
		}
	}, [content]);
	return (
		<BottomSheetModal
			ref={modalRef}
			enableDynamicSizing
			handleIndicatorStyle={styles.handleIndicator}
			onDismiss={resetContextMenu}
			backgroundComponent={() => (
				<View style={styles.modalBackground}>
					<BlurView style={{ flex: 1 }} />
				</View>
			)}
			backdropComponent={Backdrop}
		>
			<BottomSheetView style={styles.modal}>
				{content && <ContextMenuHeader header={content.header} />}
				<View style={styles.items}>
					{content?.items.map((itemGroup, itemGroupIdx) => (
						<Fragment key={itemGroupIdx}>
							<Divider
								h
								boxProps={{ style: styles.thickDivider }}
							/>
							{itemGroup.map((item, idx) => (
								<Fragment key={item.label}>
									<ContextMenuItemComponent
										item={item}
										modalRef={modalRef}
									/>
									{idx !== itemGroup.length - 1 && (
										<Divider h />
									)}
								</Fragment>
							))}
						</Fragment>
					))}
				</View>
			</BottomSheetView>
		</BottomSheetModal>
	);
};

const Backdrop = (props: BottomSheetBackdropProps) => {
	return (
		<BottomSheetBackdrop
			{...props}
			opacity={0.4}
			disappearsOnIndex={-1}
			appearsOnIndex={0}
			pressBehavior={"close"}
		/>
	);
};

const ContextMenuHeader = ({ header }: { header: HeaderProps }) => {
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

const ContextMenuItemComponent = ({
	item,
	modalRef,
}: { item: ContextMenuItem; modalRef: RefObject<BottomSheetModal | null> }) => {
	const router = useRouter();
	const { t } = useTranslation();
	return (
		<Pressable
			key={item.label}
			style={styles.item}
			onPress={() => {
				modalRef.current?.close();
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

const styles = StyleSheet.create((theme, rt) => ({
	modalBackground: {
		...StyleSheet.absoluteFillObject,
		borderTopLeftRadius: theme.borderRadius * 2,
		borderTopRightRadius: theme.borderRadius * 2,
		overflow: "hidden",
	},
	handleIndicator: { marginTop: theme.gap(1) },
	thickDivider: { height: 2 },
	modal: {
		paddingHorizontal: theme.gap(2),
		paddingBottom: theme.gap(2),
		paddingTop: theme.gap(1),
		maxHeight: rt.screen.height / 2,
		backgroundColor: "transparent",
	},
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
	headerText: { justifyContent: "space-evenly" },
}));
