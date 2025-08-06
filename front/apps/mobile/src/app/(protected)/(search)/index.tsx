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
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { getSearchHistory, searchAll } from "@/api/queries";
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
import { InfiniteView } from "~/components/infinite/view";
import { SearchResultItem } from "~/components/item/resource/search-result";
import { TextInput } from "~/primitives/text_input";

//TODO Allow filtering by type (artist, album, etc.)

export default function SearchView() {
	const timeoutRef = useRef<number>(null);
	const api = useAPI();
	const playTrack = useSetAtom(playTrackAtom);
	const queryClient = useQueryClient();
	const [searchValue, setSearchValue] = useState("");
	const debounceSearch = useCallback((searchValue: string) => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => {
			setSearchValue(searchValue);
		}, 500);
	}, []);
	const query = useMemo(() => {
		if (searchValue.trim() === "") {
			return searchResultQueryToResourceQuery(getSearchHistory());
		}
		return searchResultQueryToResourceQuery(searchAll(searchValue));
	}, [searchValue]);

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
						containerStyle={{ backgroundColor: "transparent" }}
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
			controls={{}}
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

const searchResultQueryToResourceQuery = (query: Query<SearchResult[]>) => {
	return transformPage(toInfiniteQuery(query), (item) => {
		return {
			...item,
			id: item.song
				? `song-${item.song.id}`
				: item.album
					? `album-${item.album.id}`
					: item.video
						? `video-${item.video.id}`
						: `artist-${item.artist.id}`,
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
