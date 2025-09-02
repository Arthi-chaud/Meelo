import { useCallback } from "react";
import type Playlist from "@/models/playlist";
import { AddIcon } from "@/ui/icons";
import { useModal } from "~/components/bottom-modal-sheet";
import { CreateUpdatePlaylistForm } from "~/components/playlist/create-update";
import type { Action } from "..";

export const useUpdatePlaylistFormModal = (
	playlist?: Playlist,
	onCreated?: (playlist: Playlist) => void,
) => {
	const content = useCallback(() => {
		return (
			<CreateUpdatePlaylistForm
				existingPlaylist={playlist}
				onCreated={onCreated}
			/>
		);
	}, []);
	const { openModal } = useModal({
		content,
		onDismiss: () => {},
	});
	return { openFormModal: openModal };
};
export const useCreatePlaylistFormModal = useUpdatePlaylistFormModal;

export const CreatePlaylist = (onPress: () => void): Action => ({
	label: "actions.new",
	icon: AddIcon,
	onPress,
});
