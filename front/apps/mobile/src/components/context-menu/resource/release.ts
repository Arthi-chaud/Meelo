import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { getAlbum, getCurrentUserStatus } from "@/api/queries";
import type { ReleaseWithRelations } from "@/models/release";
import { AlbumIcon, ArtistIcon } from "@/ui/icons";
import { getYear } from "@/utils/date";
import { type Action, PlayReleaseAction } from "~/actions";
import { useSetReleaseAsMaster } from "~/actions/master";
import { ShareAction, useShareCallback } from "~/actions/share";
import { useQuery, useQueryClient } from "~/api";
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
				[goToRelease, goToArtist],
				user?.admin && release ? [SetAsMaster] : [],
				[
					ShareAction(() =>
						buildUrlAndShare(`/releases/${release?.id}`),
					),
				],
			],
		} satisfies ContextMenu;
	}, [release]);
};
