import { useCallback } from "react";
import { AddIcon } from "@/ui/icons";
import { useModal } from "~/components/bottom-modal-sheet";
import { CreateUpdatePlaylistForm } from "~/components/playlist/create-update";
import type { Action } from "..";

export const useCreatePlaylistFormModal = () => {
	const content = useCallback(() => {
		return <CreateUpdatePlaylistForm />;
	}, []);
	const { openModal } = useModal({
		content,
		onDismiss: () => {},
	});
	return { openFormModal: openModal };
};

export const CreatePlaylist = (onPress: () => void): Action => ({
	label: "actions.new",
	icon: AddIcon,
	onPress,
});

// export const UpdatePlaylist = (
// 	playlist: Playlist,
// 	onPress: () => void,
// ): Action => ({
// 	label: "actions.update",
// 	icon: AddIcon,
// 	onPress,
// });
