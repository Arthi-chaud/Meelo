import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { getPlaylistEntries } from "@/api/queries";
import { transformPage } from "@/api/query";
import type { PlaylistWithRelations } from "@/models/playlist";
import { playFromInfiniteQuery } from "@/state/player";
import { PlayIcon, PlaylistIcon } from "@/ui/icons";
import { useQueryClient } from "~/api";
import type { ContextMenu } from "..";

export const usePlaylistContextMenu = (
	playlist: PlaylistWithRelations<"illustration"> | undefined,
) => {
	const queryClient = useQueryClient();
	const playTracks = useSetAtom(playFromInfiniteQuery);
	const playPlaylist = useCallback(() => {
		if (!playlist) {
			return;
		}
		const query = transformPage(
			getPlaylistEntries(playlist.id, [
				"illustration",
				"artist",
				"master",
			]),
			({ artist, master, illustration, entryId }) => ({
				artist,
				track: { ...master, illustration },
				id: entryId,
			}),
		);

		playTracks(query, queryClient);
	}, [playlist, playTracks]);
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
						label: "actions.goToPlaylist",
						icon: PlaylistIcon,
						href: playlist
							? `/playlists/${playlist.id}`
							: undefined,
					},
				],
				[
					{
						label: "actions.playback.play",
						icon: PlayIcon,
						onPress: playPlaylist,
					},
				],
			],
		} satisfies ContextMenu;
	}, [playlist, playPlaylist]);
};
