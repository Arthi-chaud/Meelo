import {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetModal,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import { atom, useAtom, useSetAtom } from "jotai";
import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { BlurView } from "~/components/blur-view";

type ModalAtom = { content: () => ReactNode; onDismiss?: () => void };

const modalAtom = atom<ModalAtom | null>(null);

export const closeModalAtom = atom(null, (_, set) => set(modalAtom, null));

export const useModal = (p: ModalAtom) => {
	const setModalContent = useSetAtom(modalAtom);
	const openModal = useCallback(() => setModalContent(p), [p]);
	return { openModal };
};

export const Modal = () => {
	const [modalContent, setModalContent] = useAtom(modalAtom);
	const onClose = useCallback(() => {
		modalContent?.onDismiss?.();
		setModalContent(null);
	}, [modalContent]);
	const Content = modalContent?.content ?? View;
	const modalRef = useRef<BottomSheetModal>(null);

	useEffect(() => {
		if (modalContent !== null) {
			modalRef.current?.present();
		} else {
			modalRef.current?.close();
			onClose();
		}
	}, [modalContent, onClose]);
	return (
		<BottomSheetModal
			ref={modalRef}
			enableDynamicSizing
			// Note: When a ctx menu is open from the expanded player, we don't want to 'switch'
			stackBehavior="push"
			handleIndicatorStyle={styles.handleIndicator}
			onDismiss={onClose}
			backgroundComponent={() => (
				<View style={styles.modalBackground}>
					<BlurView style={{ flex: 1 }} />
				</View>
			)}
			keyboardBehavior="interactive"
			keyboardBlurBehavior="restore"
			backdropComponent={ModalBackdrop}
		>
			<BottomSheetView style={styles.modal}>
				<Content />
			</BottomSheetView>
		</BottomSheetModal>
	);
};

// The expanded player uses this as well
export const ModalBackdrop = (props: BottomSheetBackdropProps) => {
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

const styles = StyleSheet.create((theme) => ({
	modalBackground: {
		...StyleSheet.absoluteFillObject,
		borderTopLeftRadius: theme.borderRadius * 2,
		borderTopRightRadius: theme.borderRadius * 2,
		overflow: "hidden",
	},
	handleIndicator: {
		marginTop: theme.gap(1),
		backgroundColor: theme.colors.text.primary,
	},
	modal: {
		paddingHorizontal: theme.gap(2),
		paddingBottom: theme.gap(2),
		paddingTop: theme.gap(1),
		backgroundColor: "transparent",
	},
}));
