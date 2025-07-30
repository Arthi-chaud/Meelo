import { getAlbum } from "@/api/queries";
import type { ReleaseWithRelations } from "@/models/release";
import { AlbumIcon, ArtistIcon } from "@/ui/icons";
import { getYear } from "@/utils/date";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import type { Action } from "~/actions";
import { ShareAction, useShareCallback } from "~/actions/share";
import { useQueryClient } from "~/api";
import type { ContextMenuProps } from "..";

export const useReleaseContextMenu = (
	release: ReleaseWithRelations<"illustration"> | undefined,
) => {
	const router = useRouter();
	const queryClient = useQueryClient();
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
							artistId && router.push(`/artists/${artistId}`),
					);
			},
		} satisfies Action;
	}, [release]);
	return useMemo(() => {
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
				[goToRelease, goToArtist],
				[
					ShareAction(() =>
						buildUrlAndShare(`/releases/${release?.id}`),
					),
				],
			],
		} satisfies ContextMenuProps;
	}, [release]);
};
