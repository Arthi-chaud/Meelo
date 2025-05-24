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

import { useAPI, useQueryClient } from "@/api/hook";
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
import type { IllustratedResource } from "@/models/illustration";
import type Resource from "@/models/resource";
import type { SaveSearchItem, SearchResult } from "@/models/search";
import { playTrackAtom } from "@/state/player";
import formatArtists from "@/utils/format-artists";
import { Box, InputAdornment, Tab, Tabs, TextField } from "@mui/material";
import { useSetAtom } from "jotai";
import type { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import type { GetPropsTypesFrom, Page } from "ssr";
import { Head } from "~/components/head";
import { SearchIcon } from "@/components/icons";
import InfiniteList from "~/components/infinite/list";
import InfiniteAlbumView from "~/components/infinite/resource/album";
import InfiniteArtistView from "~/components/infinite/resource/artist";
import { InfiniteSongView } from "~/components/infinite/resource/song";
import InfiniteVideoView from "~/components/infinite/resource/video";
import AlbumItem from "~/components/list-item/resource/album";
import ArtistItem from "~/components/list-item/resource/artist";
import SongItem from "~/components/list-item/resource/song";
import VideoItem from "~/components/list-item/resource/video";
import { useTabRouter } from "~/components/tab-router";

const prepareSSR = (context: NextPageContext) => {
	const searchQuery = context.query.query?.at(0) ?? null;
	const type = (context.query.t as string) ?? null;

	return {
		additionalProps: { searchQuery, type },
		infiniteQueries: [
			transformSearchResultQuery(getSearchHistory()),
			...(searchQuery
				? [
						getArtists({ query: searchQuery }, undefined, [
							"illustration",
						]),
						getAlbums({ query: searchQuery }, undefined, [
							"artist",
							"illustration",
						]),
						getSongs({ query: searchQuery }, undefined, [
							"artist",
							"featuring",
							"master",
							"illustration",
						]),
						getVideos({ query: searchQuery }, undefined, [
							"artist",
							"master",
							"illustration",
						]),
						transformSearchResultQuery(searchAll(searchQuery)),
					]
				: []),
		],
	};
};

const transformSearchResultQuery = (q: Query<SearchResult[]>) => {
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
	const playTrack = useSetAtom(playTrackAtom);
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
	const api = useAPI();
	const [inputValue, setInputValue] = useState(query);
	const [debounceId, setDebounceId] = useState<NodeJS.Timeout>();
	const saveSearch = useMutation(async (dto: SaveSearchItem) => {
		try {
			await api.saveSearchHistoryEntry(dto);
			// Sometimes, it refreshes to fast, and shifts the history
			// before openning a page (for artists) is done
			setTimeout(() => {
				queryClient.client.invalidateQueries(getSearchHistory().key);
			}, 500);
		} catch (error) {
			// biome-ignore lint/suspicious/noConsole: <explanation>
			console.error(error);
		}
	});
	const searchAllQuery = useMemo(
		() =>
			transformSearchResultQuery(
				query ? searchAll(query) : getSearchHistory(),
			) as unknown as InfiniteQuery<
				Resource,
				SearchResult & IllustratedResource
			>,
		[query],
	);
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
			<Head title={t("nav.search")} />
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
						label={t(
							value === "all"
								? "search.all"
								: `models.${value}_plural`,
						)}
					/>
				))}
			</Tabs>
			<Box sx={{ paddingBottom: 2 }} />
			{selectedTab === "all" && (
				<InfiniteList
					query={() => searchAllQuery}
					render={(item) =>
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
									`${t("models.album")} • ${
										album.artist?.name ??
										t("compilationArtistLabel")
									}`
								}
							/>
						) : item.song ? (
							<SongItem
								onClick={() => {
									playTrack({
										track: {
											...item.song.master,
											illustration: item.illustration,
										},
										artist: item.song.artist,
									});
									saveSearch.mutate({ songId: item.song.id });
								}}
								song={item.song}
								subtitles={[
									async (song) =>
										`${t("models.song")} • ${formatArtists(
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
										`${t("models.video")} • ${formatArtists(
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
					disableSort
					onItemClick={(item) =>
						item && saveSearch.mutate({ artistId: item.id })
					}
					query={({ libraries }) =>
						getArtists(
							{
								query: encodeURIComponent(query),
								library: libraries,
							},
							undefined,
							["illustration"],
						)
					}
				/>
			)}
			{query && selectedTab === "album" && (
				<InfiniteAlbumView
					disableSort
					onItemClick={(item) =>
						item && saveSearch.mutate({ albumId: item.id })
					}
					query={({ libraries, types }) =>
						getAlbums(
							{
								query: encodeURIComponent(query),
								type: types,
								library: libraries,
							},
							undefined,
							["artist", "illustration"],
						)
					}
				/>
			)}
			{query && selectedTab === "song" && (
				<InfiniteSongView
					disableSort
					onItemClick={(item) =>
						item && saveSearch.mutate({ songId: item.id })
					}
					query={({ libraries, types }) =>
						getSongs(
							{
								query: encodeURIComponent(query),
								type: types,
								library: libraries,
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
					disableSort
					subtitle="artist"
					query={({ libraries, types }) =>
						getVideos(
							{
								query: encodeURIComponent(query),
								type: types,
								library: libraries,
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
