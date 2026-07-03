import { useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { getSongs } from "@/api/queries";
import type { LabelWithRelations } from "@/models/label";
import {
	infiniteSongQueryToPlayerQuery,
	playFromInfiniteQuery,
} from "@/state/player";
import { AlbumIcon, ArtistIcon, LabelIcon, RadioIcon } from "@/ui/icons";
import { formatLabelDates } from "@/utils/format-label-dates";
import { getRandomNumber } from "@/utils/random";
import { useQueryClient } from "~/api";
import type { ContextMenu } from "..";

export const useLabelContextMenu = (
	label: LabelWithRelations<"area"> | undefined,
) => {
	const queryClient = useQueryClient();
	const playFromQuery = useSetAtom(playFromInfiniteQuery);
	const startLabelRadio = useCallback(() => {
		if (!label) {
			return;
		}
		const seed = getRandomNumber();
		const query = infiniteSongQueryToPlayerQuery(
			getSongs({ label: label.id, random: seed }, undefined, [
				"artist",
				"featuring",
				"master",
				"illustration",
			]),
		);
		playFromQuery(query, queryClient);
	}, [label, queryClient]);
	const subtitle = useMemo(() => {
		if (!label) {
			return undefined;
		}
		if (!label.startDate && !label.area) {
			return null;
		}
		return [
			formatLabelDates(label.startDate, label.endDate),
			label.area?.name,
		]
			.filter((item) => item)
			.join(" • ");
	}, [label]);
	return useCallback(() => {
		return {
			header: {
				title: label?.name,
				subtitle: subtitle,
				illustration: null,
				illustrationProps: { fallbackIcon: LabelIcon },
			},
			items: [
				[
					{
						label: "actions.label.startRadio",
						icon: RadioIcon,
						onPress: startLabelRadio,
					},
					{
						label: "actions.artist.seeAlbums",
						icon: AlbumIcon,
						href: `/albums?label=${label?.id}`,
					},
					{
						label: "actions.seeArtists",
						icon: ArtistIcon,
						href: `/artists?label=${label?.id}`,
					},
				],
			],
		} satisfies ContextMenu;
	}, [label]);
};
