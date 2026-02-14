import { useCallback } from "react";
import type { ArtistWithRelations } from "@/models/artist";
import { GoToArtist, GoToArtistAlbums, GoToArtistSongs } from "~/actions";
import { useAddToPlaylistAction } from "~/actions/add-to-playlist";
import { useShareArtistAction } from "~/actions/share";
import type {
	ContextMenu,
	ContextMenuBuilder,
} from "~/components/context-menu";

// We accept null so that we can easily deal with albums w/o artists
export const useArtistContextMenu = (
	artist: ArtistWithRelations<"illustration"> | undefined | null,
): ContextMenuBuilder => {
	const ShareAction = useShareArtistAction(artist?.id);
	const addToPlaylistAction = useAddToPlaylistAction(
		artist ? { artistId: artist.id } : undefined,
	);
	return useCallback(() => {
		return {
			header: {
				illustration: artist?.illustration,
				illustrationProps: { variant: "circle", useBlurhash: true },
				title: artist?.name,
				subtitle: null,
			},
			items: [
				artist
					? [
							GoToArtist(artist.id),
							GoToArtistAlbums(artist.id),
							GoToArtistSongs(artist.id),
						]
					: [],
				[addToPlaylistAction],
				ShareAction ? [ShareAction] : [],
			],
		} satisfies ContextMenu;
	}, [artist]);
};
