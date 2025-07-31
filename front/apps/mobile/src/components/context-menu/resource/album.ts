import type { AlbumWithRelations } from "@/models/album";
import { getYear } from "@/utils/date";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChangeType, GoToArtist, GoToRelease } from "~/actions";
import { useShareAlbumAction } from "~/actions/share";
import { useChangeAlbumTypeModal } from "~/components/change-type";
import type {
	ContextMenu,
	ContextMenuBuilder,
	ContextMenuItem,
} from "~/components/context-menu";

//TODO Refresh Metadata
//TODO Disable changing type if not admin

export const useAlbumContextMenu = (
	album: AlbumWithRelations<"artist" | "illustration"> | undefined,
): ContextMenuBuilder => {
	const { t } = useTranslation();
	const ShareAction = useShareAlbumAction(album?.id);
	const { openChangeTypeModal } = useChangeAlbumTypeModal(album);
	const getSubtitle = useCallback(() => {
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
		const goToItems: ContextMenuItem[] = [];
		if (album?.masterId) {
			goToItems.push(GoToRelease(album.masterId));
		}
		if (album?.artistId) {
			goToItems.push(GoToArtist(album.artistId));
		}
		return {
			header: {
				illustration: album?.illustration,
				title: album?.name,
				subtitle: getSubtitle(),
			},
			items: [
				goToItems,
				[ChangeType("actions.album.changeType", openChangeTypeModal)],
				ShareAction ? [ShareAction] : [],
			],
		} satisfies ContextMenu;
	}, [album]);
};
