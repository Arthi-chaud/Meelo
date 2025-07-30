import type { AlbumWithRelations } from "@/models/album";
import { AlbumIcon, ArtistIcon, EditIcon } from "@/ui/icons";
import { getYear } from "@/utils/date";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ShareAction, useShareCallback } from "~/actions/share";
import { useChangeAlbumTypeModal } from "~/components/change-type";
import type {
	ContextMenu,
	ContextMenuBuilder,
	ContextMenuItem,
} from "~/components/context-menu";

//TODO Refresh Metadata

export const useAlbumContextMenu = (
	album: AlbumWithRelations<"artist" | "illustration"> | undefined,
): ContextMenuBuilder => {
	const { t } = useTranslation();
	const buildUrlAndShare = useShareCallback();
	const { openChangeTypeModal } = useChangeAlbumTypeModal(album);
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
	return useCallback(() => {
		const goToItems: ContextMenuItem[] = [
			{
				label: "actions.album.goToAlbum",
				icon: AlbumIcon,
				href: album ? `/releases/${album.masterId}` : undefined,
			},
		];
		if (album?.artistId) {
			goToItems.push({
				label: "actions.goToArtist",
				icon: ArtistIcon,
				href: album ? `/artists/${album.artistId}` : undefined,
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
				[
					{
						label: "actions.album.changeType",
						icon: EditIcon,
						onPress: openChangeTypeModal,
						nestedModal: true,
					},
				],
				album
					? [
							ShareAction(() =>
								buildUrlAndShare(`/albums/${album.id}`),
							),
						]
					: [],
			],
		} satisfies ContextMenu;
	}, [album]);
};
