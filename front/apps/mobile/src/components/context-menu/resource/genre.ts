import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getSongs } from "@/api/queries";
import { transformPage } from "@/api/query";
import type Genre from "@/models/genre";
import { playFromInfiniteQuery } from "@/state/player";
import { AlbumIcon, GenreIcon, RadioIcon, SongIcon } from "@/ui/icons";
import { getRandomNumber } from "@/utils/random";
import { useQueryClient } from "~/api";
import type { ContextMenu } from "..";

export const useGenreContextMenu = (genre: Genre | undefined) => {
	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const playFromQuery = useSetAtom(playFromInfiniteQuery);
	const startGenreRadio = useCallback(() => {
		if (!genre) {
			return;
		}
		const seed = getRandomNumber();
		const query = transformPage(
			getSongs({ genre: genre.id, random: seed }, undefined, [
				"artist",
				"featuring",
				"master",
				"illustration",
			]),
			(s) => ({
				id: s.id,
				track: { ...s.master, illustration: s.illustration },
				artist: s.artist,
				featuring: s.featuring,
			}),
		);
		playFromQuery(query, queryClient);
	}, [genre, queryClient]);
	return useCallback(() => {
		return {
			header: {
				title: genre?.name,
				subtitle: t("models.genre"),
				illustration: null,
				illustrationProps: { fallbackIcon: GenreIcon },
			},
			items: [
				[
					{
						label: "actions.genre.startRadio",
						icon: RadioIcon,
						onPress: startGenreRadio,
					},
				],
				[
					{
						label: "actions.artist.seeSongs",
						icon: SongIcon,
						href: `/songs?genre=${genre?.id}`,
					},
					{
						label: "actions.artist.seeAlbums",
						icon: AlbumIcon,
						href: `/albums?genre=${genre?.id}`,
					},
				],
			],
		} satisfies ContextMenu;
	}, [genre]);
};
