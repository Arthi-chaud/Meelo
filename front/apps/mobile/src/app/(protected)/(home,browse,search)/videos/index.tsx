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

import { useLocalSearchParams } from "expo-router";
import { useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { getArtist, getSong, getVideos } from "@/api/queries";
import { transformPage } from "@/api/query";
import { videoTypeToTranslationKey } from "@/models/utils";
import type Video from "@/models/video";
import { VideoSortingKeys, VideoType } from "@/models/video";
import { playFromInfiniteQuery } from "@/state/player";
import { PlayIcon, ShuffleIcon } from "@/ui/icons";
import { getRandomNumber } from "@/utils/random";
import type { Action } from "~/actions";
import { useQuery, useQueryClient } from "~/api";
import {
	useLibraryFiltersControl,
	useTypeFiltersControl,
} from "~/components/infinite/controls/filters";
import { useLayoutControl } from "~/components/infinite/controls/layout";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { VideoItem, VideoTile } from "~/components/item/resource/video";
import { ArtistHeader, SongHeader } from "~/components/resource-header";

export default function VideoBrowseView() {
	const queryClient = useQueryClient();
	const playTracks = useSetAtom(playFromInfiniteQuery);
	const { artist: artistId, song: songId } = useLocalSearchParams<{
		artist?: string;
		song?: string;
	}>();
	const [{ layout }, layoutControl] = useLayoutControl({
		defaultLayout: "grid",
		enableToggle: true,
	});
	const [{ sort, order }, sortControl] = useSortControl({
		sortingKeys: VideoSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	const [libraries, libraryFilterControl] = useLibraryFiltersControl();
	const [types, albumTypeFilterControl] = useTypeFiltersControl({
		types: VideoType,
		translate: (t) => videoTypeToTranslationKey(t, false),
	});
	const Item = useMemo(
		() => (layout === "list" ? VideoItem : VideoTile),
		[layout],
	);
	const { data: artist } = useQuery(
		(artistId) => getArtist(artistId, ["illustration"]),
		artistId,
	);
	const { data: song } = useQuery(
		(songId) => getSong(songId, ["illustration", "artist", "featuring"]),
		songId,
	);
	const getQuery = useCallback(
		(random?: number) =>
			getVideos(
				{
					library: libraries,
					type: types,
					artist: artistId,
					group: song?.groupId,
					random,
				},
				{ sortBy: sort ?? "name", order: order ?? "asc" },
				["artist", "illustration", "master", "song"],
			),
		[libraries, types, artistId, song, sort, order],
	);
	const query = useMemo(() => getQuery(), [getQuery]);
	const getQueryForPlayer = useCallback(
		(random?: number) =>
			transformPage(
				getQuery(random),
				({ master, illustration, artist, id }) => ({
					artist,
					track: { ...master, illustration },
					id,
				}),
			),
		[getQuery],
	);
	const onItemPress = useCallback(
		(index: number, videos: Video[] | undefined) => {
			if (videos === undefined) {
				return;
			}
			const afterId = index > 0 ? videos[index - 1]?.id : undefined;
			playTracks(getQueryForPlayer(), queryClient, afterId);
		},
		[query],
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
		<InfiniteView
			layout={layout}
			header={
				artistId ? (
					<ArtistHeader artist={artist} />
				) : songId ? (
					<SongHeader song={song} />
				) : undefined
			}
			controls={{
				layout: layoutControl,
				sort: sortControl,
				filters: [libraryFilterControl, albumTypeFilterControl],
				actions: [playAction, shuffleAction],
			}}
			query={query}
			render={(video, idx, videos) => (
				<Item
					video={video}
					onPress={() => video && onItemPress(idx, videos)}
					subtitle={artistId || songId ? "duration" : "artistName"}
					illustrationProps={{
						simpleColorPlaceholder: true,
						normalizedThumbnail: true,
					}}
				/>
			)}
		/>
	);
}
