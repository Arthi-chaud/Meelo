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

import { Box, InputAdornment, Tab, Tabs, TextField } from "@mui/material";
import type { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import API from "../../api/api";
import {
	type Query,
	toInfiniteQuery,
	transformPage,
	useQueryClient,
} from "../../api/use-query";
import { Head } from "../../components/head";
import { SearchIcon } from "../../components/icons";
import InfiniteAlbumView from "../../components/infinite/infinite-resource-view/infinite-album-view";
import InfiniteArtistView from "../../components/infinite/infinite-resource-view/infinite-artist-view";
import InfiniteSongView from "../../components/infinite/infinite-resource-view/infinite-song-view";
import InfiniteVideoView from "../../components/infinite/infinite-resource-view/infinite-video-view";
import InfiniteView from "../../components/infinite/infinite-view";
import AlbumItem from "../../components/list-item/album-item";
import ArtistItem from "../../components/list-item/artist-item";
import SongItem from "../../components/list-item/song-item";
import VideoItem from "../../components/list-item/video-item";
import { useTabRouter } from "../../components/tab-router";
import type { SaveSearchItem, SearchResult } from "../../models/search";
import type { GetPropsTypesFrom, Page } from "../../ssr";
import formatArtists from "../../utils/formatArtists";

const prepareSSR = (context: NextPageContext) => {
	const searchQuery = context.query.query?.at(0) ?? null;
	const type = (context.query.t as string) ?? null;

	return {
		additionalProps: { searchQuery, type },
		infiniteQueries: [
			searchResultQueryToInfinite(API.getSearchHistory()),
			...(searchQuery
				? [
						API.getArtists({ query: searchQuery }, undefined, [
							"illustration",
						]),
						API.getAlbums({ query: searchQuery }, undefined, [
							"artist",
							"illustration",
						]),
						API.getSongs({ query: searchQuery }, undefined, [
							"artist",
							"featuring",
							"master",
							"illustration",
						]),
						API.getVideos({ query: searchQuery }, undefined, [
							"artist",
							"master",
							"illustration",
						]),
						searchResultQueryToInfinite(API.searchAll(searchQuery)),
					]
				: []),
		],
	};
};

const searchResultQueryToInfinite = (q: Query<SearchResult[]>) => {
	return transformPage(toInfiniteQuery(q), (item, index) => ({
		...item,
		id: index,
		illustration:
			item.song?.illustration ??
			item.artist?.illustration ??
			item.album?.illustration ??
			null,
	}));
};

const buildSearchUrl = (
	query: string | undefined,
	type: string | undefined,
) => {
	return `/search/${query ?? ""}${type ? `?t=${type}` : ""}`;
};

const tabs = ["all", "artist", "album", "song", "video"] as const;

const SearchPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const router = useRouter();
	const searchQuery = props?.searchQuery;
	const { t } = useTranslation();
	const [query, setQuery] = useState<string | undefined>(
		(searchQuery ?? Array.from(router.query.query ?? []).join(" ")) ||
			undefined,
	);
	const { selectedTab, selectTab } = useTabRouter(
		(r) => r.query.t,
		(newTab) => buildSearchUrl(query, newTab),
		...tabs,
	);
	const queryClient = useQueryClient();
	const [inputValue, setInputValue] = useState(query);
	const [debounceId, setDebounceId] = useState<NodeJS.Timeout>();
	const saveSearch = useMutation((dto: SaveSearchItem) => {
		return API.saveSearchHistoryEntry(dto)
			.then(() => {
				// Sometimes, it refreshes to fast, and shifts the history
				// before openning a page (for artists) is done
				setTimeout(() => {
					queryClient.client.invalidateQueries(
						API.getSearchHistory().key,
					);
				}, 500);
			})

			.catch((error: Error) => console.error(error));
	});
	useEffect(() => {
		if (debounceId) {
			clearTimeout(debounceId);
		}
		setDebounceId(
			setTimeout(() => {
				setQuery(inputValue || undefined);
				router.push(
					buildSearchUrl(inputValue, selectedTab),
					undefined,
					{
						shallow: true,
					},
				);
				setDebounceId(undefined);
			}, 400),
		);
	}, [inputValue]);
	useEffect(() => {
		return () => {
			clearTimeout(debounceId);
		};
	}, [debounceId]);

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				paddingY: 3,
				flexDirection: "column",
			}}
		>
			<Head title={t("search")} />
			<Box
				sx={{ display: "flex", justifyContent: "center", paddingY: 2 }}
			>
				<TextField
					label="Search"
					variant="outlined"
					autoFocus
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							(document.activeElement as any)?.blur();
						}
					}}
					InputProps={{
						value: inputValue,
						autoComplete: "off",
						autoCorrect: "off",
						spellCheck: false,
						autoCapitalize: "off",
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon />
							</InputAdornment>
						),
					}}
					onChange={(event) => {
						setInputValue(event.target.value || undefined);
					}}
				/>
			</Box>
			<Tabs
				value={selectedTab}
				onChange={(__, tabName) => selectTab(tabName)}
				variant="scrollable"
			>
				{tabs.map((value, index) => (
					<Tab
						key={index}
						value={value}
						sx={{ minWidth: "fit-content", flex: 1 }}
						label={t(value === "all" ? "All" : `${value}s`)}
					/>
				))}
			</Tabs>
			<Box sx={{ paddingBottom: 2 }} />
			{selectedTab === "all" && (
				<InfiniteView
					view="list"
					query={() =>
						searchResultQueryToInfinite(
							query
								? API.searchAll(query)
								: API.getSearchHistory(),
						)
					}
					renderGridItem={() => <></>}
					renderListItem={(item) =>
						!item || item.album ? (
							<AlbumItem
								onClick={() =>
									item &&
									saveSearch.mutate({
										albumId: item.album.id,
									})
								}
								album={item?.album}
								formatSubtitle={(album) =>
									`${t("album")} • ${
										album.artist?.name ?? t("compilation")
									}`
								}
							/>
						) : item.song ? (
							<SongItem
								onClick={() =>
									saveSearch.mutate({ songId: item.song.id })
								}
								song={item.song}
								subtitles={[
									async (song) =>
										`${t("song")} • ${formatArtists(
											song.artist,
											song.featuring,
										)}`,
								]}
							/>
						) : item.video ? (
							<VideoItem
								onClick={() =>
									saveSearch.mutate({
										videoId: item.video.id,
									})
								}
								video={item.video}
								subtitles={[
									async (video) =>
										`${t("video")} • ${formatArtists(
											video.artist,
										)}`,
								]}
							/>
						) : (
							<ArtistItem
								artist={item.artist}
								onClick={() =>
									saveSearch.mutate({
										artistId: item.artist.id,
									})
								}
							/>
						)
					}
				/>
			)}
			{query && selectedTab === "artist" && (
				<InfiniteArtistView
					onItemClick={(item) =>
						item && saveSearch.mutate({ artistId: item.id })
					}
					query={({ library }) =>
						API.getArtists(
							{
								query: encodeURIComponent(query),
								library: library ?? undefined,
							},
							undefined,
							["illustration"],
						)
					}
				/>
			)}
			{query && selectedTab === "album" && (
				<InfiniteAlbumView
					onItemClick={(item) =>
						item && saveSearch.mutate({ albumId: item.id })
					}
					defaultAlbumType={null}
					query={({ library, type: newType }) =>
						API.getAlbums(
							{
								query: encodeURIComponent(query),
								type: newType,
								library: library ?? undefined,
							},
							undefined,
							["artist", "illustration"],
						)
					}
				/>
			)}
			{query && selectedTab === "song" && (
				<InfiniteSongView
					onItemClick={(item) =>
						item && saveSearch.mutate({ songId: item.id })
					}
					query={({ library, type: newType }) =>
						API.getSongs(
							{
								query: encodeURIComponent(query),
								type: newType,
								library: library ?? undefined,
							},
							undefined,
							["artist", "featuring", "master", "illustration"],
						)
					}
				/>
			)}

			{query && selectedTab === "video" && (
				<InfiniteVideoView
					onItemClick={(item) =>
						item && saveSearch.mutate({ videoId: item.id })
					}
					subtitle="artist"
					query={({ library, type: newType }) =>
						API.getVideos(
							{
								query: encodeURIComponent(query),
								type: newType,
								library: library ?? undefined,
							},
							undefined,
							["artist", "master", "illustration"],
						)
					}
				/>
			)}
		</Box>
	);
};

SearchPage.prepareSSR = prepareSSR;

export default SearchPage;
