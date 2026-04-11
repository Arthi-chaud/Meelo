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
import {
	getArtist,
	getGenre,
	getSong,
	getSongHistory,
	getSongs,
} from "@/api/queries";
import { type InfiniteQuery, transformPage } from "@/api/query";
import {
	type PlayHistoryEntry,
	SongSortingKeys,
	SongType,
	type SongWithRelations,
} from "@/models/song";
import { songTypeToTranslationKey } from "@/models/utils";
import { playFromInfiniteQuery, playTrackAtom } from "@/state/player";
import { PlayIcon, ShuffleIcon } from "@/ui/icons";
import { getRandomNumber } from "@/utils/random";
import type { Action } from "~/actions";
import { useQuery, useQueryClient } from "~/api";
import { StaticHeader } from "~/components/header";
import {
	useLibraryFiltersControl,
	useTypeFiltersControl,
} from "~/components/infinite/controls/filters";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { SongItem } from "~/components/item/resource/song";
import { ArtistHeader, SongHeader } from "~/components/resource-header";

// TODO song subtitle: allow it to be album

type SongT = SongWithRelations<
	"artist" | "master" | "featuring" | "illustration"
>;

export default function SongBrowseView() {
	const playTracks = useSetAtom(playFromInfiniteQuery);
	const playTrack = useSetAtom(playTrackAtom);
	const queryClient = useQueryClient();
	const nav = useNavigation();
	const { t } = useTranslation();
	const {
		artist: artistId,
		rare: rareArtistId,
		genre: genreId,
		versionsOf: versionsOfSongId,
		playHistory: playHistoryStr,
	} = useLocalSearchParams<{
		playHistory?: string;
		artist?: string;
		rare?: string;
		versionsOf?: string;
		genre?: string;
	}>();
	const isPlayHistory = useMemo(
		() => playHistoryStr === "true",
		[playHistoryStr],
	);
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

	const { data: genre } = useQuery((genreId) => getGenre(genreId), genreId);
	const { data: song } = useQuery(
		(songId) =>
			getSong(songId, ["artist", "illustration", "featuring", "master"]),
		versionsOfSongId,
	);
	useEffect(() => {
		if (isPlayHistory) {
			nav.setOptions({ headerTitle: t("home.playHistory") });
		} else if (rareArtistId !== undefined) {
			nav.setOptions({ headerTitle: t("artist.rareSongs") });
		} else if (versionsOfSongId !== undefined) {
			nav.setOptions({ headerTitle: t("models.versions") });
		} else if (genreId !== undefined) {
			nav.setOptions({ headerTitle: genre?.name ?? "" });
		}
	}, [rareArtistId, versionsOfSongId, genreId, genre]);
	const subtitle = useCallback(
		(songItem: SongT | undefined) => {
			if (
				artistId === undefined &&
				versionsOfSongId === undefined &&
				rareArtistId === undefined
			) {
				return "artists";
			}
			if (!songItem) {
				return null;
			}
			// If song's artist matches the main song's artist
			// + if there is no featuring, don;t display artist name
			if (
				songItem.featuring.length === 0 &&
				songItem.artistId === song?.artistId
			) {
				return null;
			}
			if (
				songItem.featuring.length > 0 ||
				songItem.artistId !== artist?.id
			) {
				return "artists";
			}
			return null;
		},
		[artistId, rareArtistId, song],
	);
	const getQuery = useCallback(
		(random?: number) => {
			const includes = [
				"artist",
				"illustration",
				"featuring",
				"master",
			] as const;
			if (isPlayHistory) {
				return getSongHistory(
					includes,
				) as unknown as InfiniteQuery<SongT>;
			}
			return getSongs(
				{
					library: libraries,
					type: types,
					artist: artistId,
					versionsOf: versionsOfSongId,
					random,
					rare: rareArtistId,
					genre: genreId,
				},
				{ sortBy: sort ?? "name", order: order ?? "asc" },
				includes,
			);
		},
		[
			isPlayHistory,
			song,
			order,
			libraries,
			types,
			artistId,
			genreId,
			versionsOfSongId,
			rareArtistId,
		],
	);
	const query = useMemo(() => getQuery(), [getQuery]);
	const getQueryForPlayer = useCallback(
		(random?: number) =>
			transformPage(
				getQuery(random),
				({ master, illustration, artist, id, featuring }) => ({
					artist,
					featuring,
					track: { ...master, illustration },
					id,
				}),
			),
		[query],
	);
	const onItemPress = useCallback(
		(index: number, songs: SongT[] | undefined) => {
			if (songs === undefined) {
				return;
			}
			if (isPlayHistory) {
				const song = songs[index];
				playTrack({
					artist: song.artist,
					featuring: song.featuring,
					track: { ...song.master, illustration: song.illustration },
				});
			} else {
				const afterId = index > 0 ? songs[index - 1]?.id : undefined;
				playTracks(getQueryForPlayer(), queryClient, afterId);
			}
		},
		[query, isPlayHistory],
	);
	const playAction = useMemo(() => {
		return {
			label: "actions.playback.playAll",
			icon: PlayIcon,
			onPress: () => {
				playTracks(getQueryForPlayer(), queryClient);
			},
		} satisfies Action;
	}, [getQueryForPlayer, queryClient]);

	const shuffleAction = useMemo(() => {
		return {
			label: "actions.playback.shuffle",
			icon: ShuffleIcon,
			onPress: () => {
				playTracks(getQueryForPlayer(getRandomNumber()), queryClient);
			},
		} satisfies Action;
	}, [getQueryForPlayer, queryClient]);
	return (
		<StaticHeader>
			<InfiniteView
				layout={"list"}
				header={
					(artistId ?? rareArtistId) !== undefined ? (
						<ArtistHeader artist={artist} />
					) : versionsOfSongId !== undefined ? (
						<SongHeader song={song} />
					) : undefined
				}
				keyExtractor={
					isPlayHistory
						? (s) =>
								(
									s as any as PlayHistoryEntry
								).playedAt.toString()
						: undefined
				}
				controls={
					isPlayHistory
						? {}
						: {
								sort: sortControl,
								filters: [
									libraryFilterControl,
									songTypeFilterControl,
								],
								actions: [playAction, shuffleAction],
							}
				}
				query={query}
				render={(songItem, idx, songs) => (
					<SongItem
						song={songItem}
						parentArtistId={artist?.id ?? song?.artistId}
						onPress={() => onItemPress(idx, songs)}
						subtitle={subtitle(songItem)}
						illustrationProps={{}}
					/>
				)}
			/>
		</StaticHeader>
	);
}
