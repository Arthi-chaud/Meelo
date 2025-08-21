import { Box, Dialog } from "@mui/material";
import { atom, useAtom, useSetAtom } from "jotai";

const modalAtom = atom<(() => JSX.Element) | null>(null);
export const closeModalAtom = atom(null, (_, set) => set(modalAtom, null));
export const openModalAtom = atom(null, (_, set, content: () => JSX.Element) =>
	set(modalAtom, () => content),
);

export const useModal = () => {
	const openModal = useSetAtom(openModalAtom);
	const closeModal = useSetAtom(closeModalAtom);
	return [openModal, closeModal] as const;
};

export const ModalSlot = () => {
	const [modalContent, setModalContent] = useAtom(modalAtom);
	const Content = modalContent ?? Box;
	return (
		<Dialog
			sx={{ zIndex: "tooltip" }}
			open={modalContent !== null}
			onClose={() => setModalContent(null)}
			fullWidth
		>
			<Content />
		</Dialog>
	);
};
