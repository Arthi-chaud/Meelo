import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type Label from "@/models/label";
import { AlbumIcon, ArtistIcon, LabelIcon } from "@/ui/icons";
import type { ContextMenu } from "..";

export const useLabelContextMenu = (label: Label | undefined) => {
	const { t } = useTranslation();
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
