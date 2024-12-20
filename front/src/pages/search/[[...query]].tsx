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

import { SearchIcon } from "../../components/icons";
import { Box, InputAdornment, Tab, Tabs, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { GetPropsTypesFrom, Page } from "../../ssr";
import API from "../../api/api";
import { NextPageContext } from "next";
import { Head } from "../../components/head";
import { useTranslation } from "react-i18next";
import { useTabRouter } from "../../components/tab-router";
import InfiniteArtistView from "../../components/infinite/infinite-resource-view/infinite-artist-view";
import InfiniteAlbumView from "../../components/infinite/infinite-resource-view/infinite-album-view";
import InfiniteSongView from "../../components/infinite/infinite-resource-view/infinite-song-view";
import InfiniteView from "../../components/infinite/infinite-view";
import { toInfiniteQuery, transformPage } from "../../api/use-query";
import AlbumItem from "../../components/list-item/album-item";
import SongItem from "../../components/list-item/song-item";
import ArtistItem from "../../components/list-item/artist-item";
import formatArtists from "../../utils/formatArtists";

const prepareSSR = (context: NextPageContext) => {
	const searchQuery = context.query.query?.at(0) ?? null;
	const type = (context.query.t as string) ?? null;

	return {
		additionalProps: { searchQuery, type },
		infiniteQueries: searchQuery
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
				]
			: [],
	};
};

const buildSearchUrl = (
	query: string | undefined,
	type: string | undefined,
) => {
	return "/search/" + (query ?? "") + (type ? `?t=${type}` : "");
};

const tabs = ["all", "artist", "album", "song"] as const;

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
	const [inputValue, setInputValue] = useState(query);
	const [debounceId, setDebounceId] = useState<NodeJS.Timeout>();
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
			}, 500),
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
						if (e.key == "Escape") {
							(document.activeElement as any)?.blur();
						}
					}}
					InputProps={{
						value: inputValue,
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
						label={t(value == "all" ? "All" : `${value}s`)}
					/>
				))}
			</Tabs>
			<Box sx={{ paddingBottom: 2 }} />
			{query && selectedTab == "all" && (
				<InfiniteView
					view="list"
					query={() =>
						transformPage(
							toInfiniteQuery(API.searchAll(query)),
							(item, index) => ({
								...item,
								id: index,
								illustration:
									item.song?.illustration ??
									item.artist?.illustration ??
									item.album?.illustration ??
									null,
							}),
						)
					}
					renderGridItem={(item) => <></>}
					renderListItem={(item) =>
						!item || item.album ? (
							<AlbumItem
								album={item?.album}
								formatSubtitle={(album) =>
									`${t("album")} • ${
										album.artist?.name ?? t("compilation")
									}`
								}
							/>
						) : item.song ? (
							<SongItem
								song={item.song}
								subtitles={[
									async (song) =>
										`${t("song")} • ${formatArtists(
											song.artist,
											song.featuring,
										)}`,
								]}
							/>
						) : (
							<ArtistItem artist={item.artist} />
						)
					}
				/>
			)}
			{query && selectedTab == "artist" && (
				<InfiniteArtistView
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
			{query && selectedTab == "album" && (
				<InfiniteAlbumView
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
			{query && selectedTab == "song" && (
				<InfiniteSongView
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
		</Box>
	);
};

SearchPage.prepareSSR = prepareSSR;

export default SearchPage;
