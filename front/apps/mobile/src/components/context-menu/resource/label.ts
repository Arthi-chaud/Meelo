import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getSongs } from "@/api/queries";
import type Label from "@/models/label";
import {
	infiniteSongQueryToPlayerQuery,
	playFromInfiniteQuery,
} from "@/state/player";
import { AlbumIcon, ArtistIcon, LabelIcon, RadioIcon } from "@/ui/icons";
import { getRandomNumber } from "@/utils/random";
import { useQueryClient } from "~/api";
import type { ContextMenu } from "..";

export const useLabelContextMenu = (label: Label | undefined) => {
	const queryClient = useQueryClient();
	const { t } = useTranslation();
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
	return useCallback(() => {
		return {
			header: {
				title: label?.name,
				subtitle: t("models.label"),
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
