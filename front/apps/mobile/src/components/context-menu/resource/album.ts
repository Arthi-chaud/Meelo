import type { AlbumWithRelations } from "@/models/album";
import { AlbumIcon, ArtistIcon } from "@/ui/icons";
import { getYear } from "@/utils/date";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ShareAction, useShareCallback } from "~/actions/share";
import type {
	ContextMenuItem,
	ContextMenuProps,
} from "~/components/context-menu";

//TODO Refresh Metadata
//TODO change album type

export const useAlbumContextMenu = (
	album: AlbumWithRelations<"artist" | "illustration"> | undefined,
) => {
	const { t } = useTranslation();
	const buildUrlAndShare = useShareCallback();
	const subtitle = useMemo(() => {
		if (!album) {
			return undefined;
		}
		const artistName = album.artist?.name ?? t("compilationArtistLabel");
		if (album.releaseDate) {
			return [artistName, getYear(album.releaseDate)?.toString()].join(
				" • ",
			);
		}
		return artistName;
	}, [album]);
	return useMemo(() => {
		if (!album) {
			return undefined;
		}
		const goToItems: ContextMenuItem[] = [
			{
				label: "actions.album.goToAlbum",
				icon: AlbumIcon,
				href: `/releases/${album.masterId}`,
			},
		];
		if (album.artistId) {
			goToItems.push({
				label: "actions.goToArtist",
				icon: ArtistIcon,
				href: `/artists/${album.artistId}`,
			});
		}
		return {
			header: {
				illustration: album?.illustration,
				title: album?.name,
				subtitle: subtitle,
			},
			items: [
				goToItems,
				[ShareAction(() => buildUrlAndShare(`/albums/${album.id}`))],
			],
		} satisfies ContextMenuProps;
	}, [album]);
};
