import { useMutation } from "@tanstack/react-query";
import { usePathname, useRouter } from "expo-router";
import { DeleteIcon } from "@/ui/icons";
import { useQueryClient } from "~/api";
import type { Action } from "..";

export const useDeletePlaylistAction = (
	playlistId: number | undefined,
): Action => {
	const queryClient = useQueryClient();
	const path = usePathname();
	const router = useRouter();
	const deletePlaylist = useMutation({
		mutationFn: async () =>
			playlistId &&
			queryClient.api.deletePlaylist(playlistId).then(() => {
				queryClient.client.invalidateQueries({
					queryKey: ["playlists"],
				});
				if (path.startsWith(`/playlist/`)) router.dismiss();
			}),
	});

	return {
		label: "actions.delete",
		icon: DeleteIcon,
		onPress: () => deletePlaylist.mutate(),
	};
};
