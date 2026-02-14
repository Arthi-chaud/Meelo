import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getCurrentUserStatus } from "@/api/queries";
import type { AlbumWithRelations } from "@/models/album";
import { getYear } from "@/utils/date";
import {
	ChangeType,
	GoToArtist,
	GoToRelease,
	PlayReleaseAction,
} from "~/actions";
import { useAddToPlaylistAction } from "~/actions/add-to-playlist";
import { useShareAlbumAction } from "~/actions/share";
import { useQuery, useQueryClient } from "~/api";
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
	const { data: user } = useQuery(getCurrentUserStatus);
	const { t } = useTranslation();
	const ShareAction = useShareAlbumAction(album?.id);
	const queryClient = useQueryClient();
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
	const addToPlaylistAction = useAddToPlaylistAction(
		album?.masterId ? { releaseId: album.masterId } : undefined,
	);
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
				album?.masterId
					? [PlayReleaseAction(album.masterId, queryClient)]
					: [],
				goToItems,
				[addToPlaylistAction],
				user?.admin
					? [
							ChangeType(
								"actions.album.changeType",
								openChangeTypeModal,
							),
						]
					: [],
				ShareAction ? [ShareAction] : [],
			],
		} satisfies ContextMenu;
	}, [album]);
};
