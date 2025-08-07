import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { ModalBackdrop } from "~/components/bottom-modal-sheet";
import { ExpandedPlayer } from "~/components/player/expanded";
import { collapsePlayerAtom, playerIsExpandedAtom } from "./state";

export const ExpandedPlayerSlot = () => {
	const insets = useSafeAreaInsets();
	const collapsePlayer = useSetAtom(collapsePlayerAtom);
	const playerIsExpanded = useAtomValue(playerIsExpandedAtom);
	const onClose = useCallback(() => collapsePlayer(), [collapsePlayer]);
	const modalRef = useRef<BottomSheetModal | null>(null);
	useEffect(() => {
		if (playerIsExpanded) {
			modalRef.current?.present();
		}
	}, [playerIsExpanded]);
	return (
		<BottomSheetModal
			ref={modalRef}
			enableDynamicSizing={false}
			snapPoints={["100%"]}
			handleIndicatorStyle={styles.handle}
			handleStyle={[styles.handleSurface, { marginTop: insets.top }]}
			onDismiss={onClose}
			backdropComponent={ModalBackdrop}
		>
			<BottomSheetView style={styles.modal}>
				<ExpandedPlayer />
			</BottomSheetView>
		</BottomSheetModal>
	);
};

// Note: most of this is copy-pasted from modal
const styles = StyleSheet.create((theme) => ({
	handle: {
		backgroundColor: theme.colors.text.primary,
	},
	handleSurface: {
		position: "absolute",
		top: 0,
		width: "100%",
		flexDirection: "row",
		justifyContent: "center",
	},
	modal: {
		height: "100%",
		backgroundColor: theme.colors.background,
	},
}));
