import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { getAlbum, getCurrentUserStatus } from "@/api/queries";
import type { ReleaseWithRelations } from "@/models/release";
import { AlbumIcon, ArtistIcon } from "@/ui/icons";
import { getYear } from "@/utils/date";
import { type Action, ChangeType, PlayReleaseAction } from "~/actions";
import { useAddToPlaylistAction } from "~/actions/add-to-playlist";
import { useSetReleaseAsMaster } from "~/actions/master";
import { ShareAction, useShareCallback } from "~/actions/share";
import { useQuery, useQueryClient } from "~/api";
import { useChangeAlbumTypeModal } from "~/components/change-type";
import type {
	ContextMenu,
	ContextMenuBuilder,
} from "~/components/context-menu";

export const useReleaseContextMenu = (
	release: ReleaseWithRelations<"illustration" | "album"> | undefined,
): ContextMenuBuilder => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: user } = useQuery(getCurrentUserStatus);
	const SetAsMaster = useSetReleaseAsMaster(release, release?.album);
	const { name: routeName } = useRoute();
	const { openChangeTypeModal } = useChangeAlbumTypeModal(release?.album);
	const buildUrlAndShare = useShareCallback();
	const subtitle = useMemo(() => {
		if (!release) {
			return undefined;
		}
		return (
			[getYear(release.releaseDate), ...release.extensions]
				.filter((e) => e !== null)
				.join(" • ") || null
		);
	}, [release]);
	const goToArtist = useMemo(() => {
		return {
			label: "actions.goToArtist",
			icon: ArtistIcon,
			disabled: !release,
			onPress: () => {
				queryClient
					.fetchQuery(getAlbum(release!.albumId))
					.then(
						({ artistId }) =>
							artistId && router.navigate(`/artists/${artistId}`),
					);
			},
		} satisfies Action;
	}, [release]);
	const addToPlaylistAction = useAddToPlaylistAction(
		release ? { releaseId: release.id } : undefined,
	);
	return useCallback(() => {
		const goToRelease: Action = {
			label: "actions.goToRelease",
			icon: AlbumIcon,
			href: release ? `/releases/${release?.id}` : undefined,
		};
		return {
			header: {
				title: release?.name,
				subtitle: subtitle,
				illustration: release?.illustration,
			},
			items: [
				release ? [PlayReleaseAction(release.id, queryClient)] : [],
				routeName.startsWith("releases/")
					? [goToArtist]
					: [goToRelease, goToArtist],
				[addToPlaylistAction],
				user?.admin && release
					? [
							SetAsMaster,
							ChangeType(
								"actions.album.changeType",
								openChangeTypeModal,
							),
						]
					: [],
				[
					ShareAction(() =>
						buildUrlAndShare(`/releases/${release?.id}`),
					),
				],
			],
		} satisfies ContextMenu;
	}, [release]);
};
