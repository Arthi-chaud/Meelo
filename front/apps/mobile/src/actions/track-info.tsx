import { useCallback } from "react";
import { InfoIcon } from "@/ui/icons";
import { useModal } from "~/components/bottom-modal-sheet";
import type { ContextMenuItem } from "~/components/context-menu";
import { TrackInfo } from "~/components/track-info";

export const useTrackInfoModal = (trackId: number | null | undefined) => {
	const content = useCallback(() => {
		if (!trackId) return null;
		return <TrackInfo trackId={trackId} />;
	}, [trackId]);
	const { openModal } = useModal({
		content,
		onDismiss: () => {},
	});
	return { openTrackInfoModal: openModal };
};

export const SeeTrackInfo = (openModal: () => void): ContextMenuItem => ({
	label: "actions.track.seeTrackInfo",
	icon: InfoIcon,
	nestedModal: true,
	onPress: openModal,
});
