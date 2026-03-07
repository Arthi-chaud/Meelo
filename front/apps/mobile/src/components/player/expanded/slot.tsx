import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { BlurView } from "~/components/blur-view";
import { ModalBackdrop } from "~/components/bottom-modal-sheet";
import { ExpandedPlayer } from "~/components/player/expanded";
import { ColorBackground } from "../utils";
import { collapsePlayerAtom, playerIsExpandedAtom } from "./state";

export const ExpandedPlayerModalKey = "EXPANDED-PLAYER";

export const ExpandedPlayerSlot = ({ blurTarget }: { blurTarget: any }) => {
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
			backgroundComponent={() => (
				<View style={StyleSheet.absoluteFillObject}>
					<BlurView blurTarget={blurTarget} style={{ flex: 1 }}>
						<ColorBackground />
						<View style={styles.baseBackground} />
					</BlurView>
				</View>
			)}
		>
			<UniBottomSheetView style={styles.modal}>
				<ExpandedPlayer />
			</UniBottomSheetView>
		</BottomSheetModal>
	);
};

const UniBottomSheetView = withUnistyles(BottomSheetView);

// Note: most of this is copy-pasted from modal
const styles = StyleSheet.create((theme) => ({
	modal: {
		height: "100%",
		backgroundColor: "transparent",
	},
	baseBackground: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: theme.colors.background,
		opacity: 0.3,
		zIndex: -1,
	},
}));
