import type Album from "@/models/album";
import type Release from "@/models/release";
import { MasterIcon } from "@/ui/icons";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Toast } from "toastify-react-native";
import { useQueryClient } from "~/api";

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
			Toast.success(t("toasts.releaseSetAsMaster"));
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

const SetAsMaster = (onPress: () => void, disabled: boolean) => ({
	onPress,
	disabled,
	label: "actions.setAsMaster" as const,
	icon: MasterIcon,
});
