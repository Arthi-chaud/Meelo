import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type Album from "@/models/album";
import type Release from "@/models/release";
import type Song from "@/models/song";
import type Track from "@/models/track";
import { MasterIcon } from "@/ui/icons";
import { useQueryClient } from "~/api";
import { showSuccessToast } from "~/primitives/toast";

export const useSetReleaseAsMaster = (
	release: Release | undefined,
	album: Album | undefined,
) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const setAsMaster = useMutation({
		mutationFn: () =>
			queryClient.api.updateAlbum(release!.albumId, {
				masterReleaseId: release?.id,
			}),
		onSuccess: () => {
			showSuccessToast({ text: t("toasts.releaseSetAsMaster") });
			queryClient.client.invalidateQueries({ queryKey: ["releases"] });
			queryClient.client.invalidateQueries({ queryKey: ["albums"] });
			queryClient.client.invalidateQueries({ queryKey: [release?.id] });
			queryClient.client.invalidateQueries({ queryKey: [release?.slug] });
			queryClient.client.invalidateQueries({
				queryKey: [album?.id],
			});
			queryClient.client.invalidateQueries({
				queryKey: [album?.slug],
			});
		},
	});
	return useMemo(
		() =>
			SetAsMaster(
				() => setAsMaster.mutateAsync(),
				!release || !album || release.id === album.masterId,
			),
		[setAsMaster, release],
	);
};

export const useSetSongTrackAsMaster = (
	track: Track | undefined,
	song: Song | undefined,
) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const setAsMaster = useMutation({
		mutationFn: () =>
			queryClient.api.updateSong(song!.id, {
				masterTrackId: track?.id,
			}),
		onSuccess: () => {
			showSuccessToast({ text: t("toasts.trackSetAsMaster") });
			queryClient.client.invalidateQueries({ queryKey: ["tracks"] });
			queryClient.client.invalidateQueries({ queryKey: ["songs"] });
			queryClient.client.invalidateQueries({ queryKey: ["releases"] });
			queryClient.client.invalidateQueries({ queryKey: [song?.id] });
			queryClient.client.invalidateQueries({ queryKey: [song?.slug] });
			queryClient.client.invalidateQueries({
				queryKey: [track?.id],
			});
			queryClient.client.invalidateQueries({
				queryKey: [track?.releaseId],
			});
		},
	});
	return useMemo(
		() =>
			SetAsMaster(
				() => setAsMaster.mutateAsync(),
				!track || !song || track.id === song.masterId,
			),
		[setAsMaster, track],
	);
};

const SetAsMaster = (onPress: () => void, disabled: boolean) => ({
	onPress,
	disabled,
	label: "actions.setAsMaster" as const,
	icon: MasterIcon,
});
