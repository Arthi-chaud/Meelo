import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet } from "react-native-unistyles";
import { ModalBackdrop } from "~/components/bottom-modal-sheet";
import { ExpandedPlayer } from "~/components/player/expanded";
import { collapsePlayerAtom, playerIsExpandedAtom } from "./state";

export const ExpandedPlayerModalKey = "EXPANDED-PLAYER";

export const ExpandedPlayerSlot = () => {
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
			name={ExpandedPlayerModalKey}
			enableDynamicSizing={false}
			snapPoints={["100%"]}
			handleComponent={null}
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
	modal: {
		height: "100%",
		backgroundColor: theme.colors.background,
	},
}));
