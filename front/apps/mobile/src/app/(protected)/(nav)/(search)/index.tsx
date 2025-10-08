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

import { useMutation } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
	getAlbums,
	getArtists,
	getSearchHistory,
	getSongs,
	getVideos,
	searchAll,
} from "@/api/queries";
import {
	type InfiniteQuery,
	type Query,
	toInfiniteQuery,
	transformPage,
} from "@/api/query";
import type Illustration from "@/models/illustration";
import type Resource from "@/models/resource";
import type { SaveSearchItem, SearchResult } from "@/models/search";
import { playTrackAtom } from "@/state/player";
import { useAPI, useQueryClient } from "~/api";
import { useSearchTypeFilterControl } from "~/components/infinite/controls/filters";
import { InfiniteView } from "~/components/infinite/view";
import { SearchResultItem } from "~/components/item/resource/search-result";
import { TextInput } from "~/primitives/text_input";

type SearchFilter = ReturnType<typeof useSearchTypeFilterControl>[0];

export default function SearchView() {
	const timeoutRef = useRef<number>(null);
	const api = useAPI();
	const [filter, filterControl] = useSearchTypeFilterControl();
	const playTrack = useSetAtom(playTrackAtom);
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [searchValue, setSearchValue] = useState("");
	const debounceSearch = useCallback((searchValue: string) => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => {
			setSearchValue(searchValue);
		}, 500);
	}, []);
	const query = useSearchQuery(searchValue, filter);
	const saveSearch = useMutation({
		mutationFn: async (item: SearchResult) => {
			try {
				const dto: SaveSearchItem = item.artist
					? { artistId: item.artist.id }
					: item.album
						? { albumId: item.album.id }
						: item.song
							? { songId: item.song.id }
							: { videoId: item.video.id };
				await api.saveSearchHistoryEntry(dto);
				// Sometimes, it refreshes to fast, and shifts the history
				// before openning a page (for artists) is done
				setTimeout(() => {
					queryClient.client.invalidateQueries({
						queryKey: getSearchHistory().key,
					});
				}, 500);
			} catch (error) {
				// biome-ignore lint/suspicious/noConsole: debug
				console.error(error);
			}
		},
	});
	const onSearchResultPress = useCallback(
		(item: SearchResult | undefined) => {
			if (!item) {
				return;
			}
			saveSearch.mutateAsync(item);
			if (item.song || item.video) {
				const track = item.song ?? item.video;
				playTrack({
					track: {
						...track.master,
						illustration: track.illustration,
					},
					featuring: item.song
						? item.song.featuring
						: // the video may be one of a song that has featuring
							undefined,
					artist: track.artist,
				});
			}
		},
		[],
	);

	return (
		<InfiniteView
			header={
				<View style={styles.searchHeader}>
					<TextInput
						autoCorrect={false}
						autoCapitalize={"none"}
						placeholder={t("nav.search")}
						onChangeText={debounceSearch}
					/>
				</View>
			}
			// NOTE: Since the original type of the query is SearchResult, it does not have an id,
			// that's why it complains
			query={
				query as unknown as InfiniteQuery<
					Resource,
					IllustratedSearchResultWithId
				>
			}
			controls={{
				filters: searchValue.trim() === "" ? [] : [filterControl],
			}}
			render={(item) => (
				<SearchResultItem
					searchResult={item}
					onPress={() => onSearchResultPress(item)}
				/>
			)}
			layout="list"
		/>
	);
}

type IllustratedSearchResultWithId = {
	id: number;
	illustration: Illustration | null;
} & SearchResult;

const useSearchQuery = (
	searchValue: string,
	filter: SearchFilter,
): InfiniteQuery<any, SearchResult> =>
	useMemo(() => {
		let query: InfiniteQuery<any, SearchResult>;
		if (searchValue.trim() === "") {
			query = searchResultQueryToResourceQuery(getSearchHistory());
		} else {
			switch (filter) {
				case "artist":
					query = transformPage(
						getArtists({ query: searchValue }, undefined, [
							"illustration",
						]),
						(artist): SearchResult => ({ artist }),
					);
					break;
				case "album":
					query = transformPage(
						getAlbums({ query: searchValue }, undefined, [
							"artist",
							"illustration",
						]),
						(album): SearchResult => ({ album }),
					);
					break;
				case "song":
					query = transformPage(
						getSongs({ query: searchValue }, undefined, [
							"illustration",
							"featuring",
							"master",
							"artist",
						]),
						(song): SearchResult => ({ song }),
					);
					break;
				case "video":
					query = transformPage(
						getVideos({ query: searchValue }, undefined, [
							"illustration",
							"master",
							"artist",
						]),
						(video): SearchResult => ({ video }),
					);
					break;
				default:
					query = searchResultQueryToResourceQuery(
						searchAll(searchValue),
					);
					break;
			}
		}
		return withStringId(query);
	}, [searchValue, filter]);

const withStringId = (q: InfiniteQuery<any, SearchResult>) =>
	transformPage(q, (item) => ({
		...item,
		id: item.song
			? `song-${item.song.id}`
			: item.album
				? `album-${item.album.id}`
				: item.video
					? `video-${item.video.id}`
					: `artist-${item.artist.id}`,
	}));

const searchResultQueryToResourceQuery = (query: Query<SearchResult[]>) => {
	return transformPage(toInfiniteQuery(query), (item) => {
		return {
			...item,
			illustration: (item.album ?? item.artist ?? item.song ?? item.video)
				?.illustration,
		};
	});
};

const styles = StyleSheet.create((theme) => ({
	searchHeader: {
		paddingTop: theme.gap(2),
		//To balance with the default top padding from root view style
		paddingBottom: theme.gap(3),
		alignItems: "center",
	},
}));
