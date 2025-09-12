import { useRoute } from "@react-navigation/native";
import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { getCurrentUserStatus, getPlaylistEntries } from "@/api/queries";
import { transformPage } from "@/api/query";
import type { PlaylistWithRelations } from "@/models/playlist";
import { playFromInfiniteQuery } from "@/state/player";
import { PlayIcon, PlaylistIcon } from "@/ui/icons";
import { useAddToPlaylistAction } from "~/actions/add-to-playlist";
import { useDeletePlaylistAction } from "~/actions/playlist/delete";
import { useSharePlaylistAction } from "~/actions/share";
import { useQuery, useQueryClient } from "~/api";
import type { ContextMenu } from "..";

export const usePlaylistContextMenu = (
	playlist: PlaylistWithRelations<"illustration"> | undefined,
) => {
	const queryClient = useQueryClient();
	const { data: user } = useQuery(getCurrentUserStatus);
	const playTracks = useSetAtom(playFromInfiniteQuery);
	const playPlaylist = useCallback(() => {
		if (!playlist) {
			return;
		}
		const query = transformPage(
			getPlaylistEntries(playlist.id, [
				"illustration",
				"artist",
				"featuring",
				"master",
			]),
			({ artist, master, illustration, featuring, entryId }) => ({
				artist,
				featuring,
				track: { ...master, illustration },
				id: entryId,
			}),
		);

		playTracks(query, queryClient);
	}, [playlist, playTracks]);
	const addToPlaylistAction = useAddToPlaylistAction(
		playlist ? { playlistId: playlist.id } : undefined,
	);
	const deleteAction = useDeletePlaylistAction(playlist?.id);
	const shareAction = useSharePlaylistAction(playlist?.id);
	const { name: routeName } = useRoute();
	return useCallback(() => {
		return {
			header: {
				title: playlist?.name,
				subtitle: null,
				illustration: playlist?.illustration,
				illustrationProps: { fallbackIcon: PlaylistIcon },
			},
			items: [
				[
					{
						label: "actions.playback.play",
						icon: PlayIcon,
						onPress: playPlaylist,
					},
				],
				routeName !== "playlists/[id]"
					? [
							{
								label: "actions.goToPlaylist",
								icon: PlaylistIcon,
								href: playlist
									? `/playlists/${playlist.id}`
									: undefined,
							},
						]
					: [],
				[addToPlaylistAction],
				user && playlist && user.id === playlist.ownerId
					? [deleteAction]
					: [],
				shareAction ? [shareAction] : [],
			],
		} satisfies ContextMenu;
	}, [playlist, playPlaylist]);
};
