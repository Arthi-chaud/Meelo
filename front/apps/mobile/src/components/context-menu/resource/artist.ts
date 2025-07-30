import type { ArtistWithRelations } from "@/models/artist";
import { AlbumIcon, ArtistIcon, SongIcon } from "@/ui/icons";
import type { Href } from "expo-router";
import { useCallback } from "react";
import { ShareAction, useShareCallback } from "~/actions/share";
import type {
	ContextMenu,
	ContextMenuBuilder,
} from "~/components/context-menu";

// We accept null so that we can easily deal with albums w/o artists
export const useArtistContextMenu = (
	artist: ArtistWithRelations<"illustration"> | undefined | null,
): ContextMenuBuilder => {
	const buildUrlAndShare = useShareCallback();
	return useCallback(() => {
		const shareCallback = artist
			? () => buildUrlAndShare(`/artists/${artist.id}`)
			: undefined;
		const artistHref: Href | undefined = artist
			? `/artists/${artist.id}`
			: undefined;
		const albumHref: Href | undefined = artist
			? `/albums?artist=${artist.id}`
			: undefined;
		const songHref: Href | undefined = artist
			? `/songs?artist=${artist.id}`
			: undefined;
		return {
			header: {
				illustration: artist?.illustration,
				illustrationProps: { variant: "circle" },
				title: artist?.name,
				subtitle: null,
			},
			items: [
				[
					{
						label: "actions.goToArtist",
						icon: ArtistIcon,
						href: artistHref,
					},

					{
						label: "actions.artist.seeAlbums",
						icon: AlbumIcon,
						href: albumHref,
					},

					{
						label: "actions.artist.seeSongs",
						icon: SongIcon,
						href: songHref,
					},
				],
				shareCallback ? [ShareAction(shareCallback)] : [],
			],
		} satisfies ContextMenu;
	}, [artist]);
};
