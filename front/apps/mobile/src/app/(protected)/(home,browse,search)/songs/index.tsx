/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { useLocalSearchParams, useNavigation } from "expo-router";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getArtist, getSong, getSongs } from "@/api/queries";
import { transformPage } from "@/api/query";
import Song, {
	SongSortingKeys,
	SongType,
	type SongWithRelations,
} from "@/models/song";
import { songTypeToTranslationKey } from "@/models/utils";
import { playFromInfiniteQuery } from "@/state/player";
import { useQuery, useQueryClient } from "~/api";
import {
	useLibraryFiltersControl,
	useTypeFiltersControl,
} from "~/components/infinite/controls/filters";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { SongItem } from "~/components/item/resource/song";
import { ArtistHeader, SongHeader } from "~/components/resource-header";

// TODO Handle Genre Query param
// TODO song subtitle: allow it to be album

export default function SongBrowseView() {
	const playTracks = useSetAtom(playFromInfiniteQuery);
	const queryClient = useQueryClient();
	const nav = useNavigation();
	const { t } = useTranslation();
	const {
		artist: artistId,
		rare: rareArtistId,
		versionsOf: versionsOfSongId,
	} = useLocalSearchParams<{
		artist?: string;
		rare?: string;
		versionsOf?: string;
	}>();
	const [{ sort, order }, sortControl] = useSortControl({
		sortingKeys: SongSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	const [libraries, libraryFilterControl] = useLibraryFiltersControl();
	const [types, songTypeFilterControl] = useTypeFiltersControl({
		types: SongType,
		translate: (t) => songTypeToTranslationKey(t, false),
	});
	const { data: artist } = useQuery(
		(artistId) => getArtist(artistId, ["illustration"]),
		artistId ?? rareArtistId,
	);

	const { data: song } = useQuery(
		(songId) => getSong(songId, ["artist", "illustration", "featuring"]),
		versionsOfSongId,
	);
	useEffect(() => {
		if (rareArtistId !== undefined) {
			nav.setOptions({ headerTitle: t("artist.rareSongs") });
		} else if (versionsOfSongId !== undefined) {
			nav.setOptions({ headerTitle: t("models.versions") });
		}
	}, [rareArtistId, versionsOfSongId]);
	const subtitle = useCallback(
		(song: SongWithRelations<"featuring"> | undefined) => {
			if (artistId === undefined && rareArtistId === undefined) {
				return "artists";
			}
			if (!song || !artist) {
				return null;
			}
			if (song.featuring.length > 0 || song.artistId !== artist.id) {
				return "artists";
			}
			return null;
		},
		[artistId, rareArtistId],
	);
	const query = useMemo(
		() =>
			getSongs(
				{
					library: libraries,
					type: types,
					artist: artistId,
					versionsOf: versionsOfSongId,
					rare: rareArtistId,
				},
				{ sortBy: sort ?? "name", order: order ?? "asc" },
				["artist", "illustration", "featuring", "master"],
			),
		[
			song,
			order,
			libraries,
			types,
			artistId,
			versionsOfSongId,
			rareArtistId,
		],
	);
	const onItemPress = useCallback(
		(index: number, songs: Song[] | undefined) => {
			if (songs === undefined) {
				return;
			}
			const afterId = index > 0 ? songs[index - 1]?.id : undefined;
			const transformedQuery = transformPage(
				query,
				({ master, illustration, artist, id }) => ({
					artist,
					track: { ...master, illustration },
					id,
				}),
			);
			playTracks(transformedQuery, queryClient, afterId);
		},
		[query],
	);
	return (
		<InfiniteView
			layout={"list"}
			header={
				(artistId ?? rareArtistId) !== undefined ? (
					<ArtistHeader artist={artist} />
				) : versionsOfSongId !== undefined ? (
					<SongHeader song={song} />
				) : undefined
			}
			controls={{
				sort: sortControl,
				filters: [libraryFilterControl, songTypeFilterControl],
			}}
			query={query}
			render={(song, idx, songs) => (
				<SongItem
					song={song}
					onPress={() => onItemPress(idx, songs)}
					subtitle={subtitle(song)}
					illustrationProps={{ simpleColorPlaceholder: true }}
				/>
			)}
		/>
	);
}
