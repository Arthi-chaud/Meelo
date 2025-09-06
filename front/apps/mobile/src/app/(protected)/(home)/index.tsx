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

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";
import { getAlbums, getArtists, getReleases, getSongs } from "@/api/queries";
import type { AlbumSortingKey } from "@/models/album";
import type { ArtistSortingKey } from "@/models/artist";
import type { SongSortingKey } from "@/models/song";
import { useInfiniteQuery } from "~/api";
import { useSetKeyIllustration } from "~/components/background-gradient";
import { AlbumTile } from "~/components/item/resource/album";
import { ArtistTile } from "~/components/item/resource/artist";
import ReleaseTile from "~/components/item/resource/release";
import { Row } from "~/components/row";
import { SafeScrollView } from "~/components/safe-view";
import { SongGrid } from "~/components/song-grid";
import type { Sorting } from "~/utils/sorting";

const styles = StyleSheet.create((theme) => ({
	main: { paddingTop: theme.gap(2), gap: theme.gap(2) },
	lastSection: {
		paddingBottom: theme.gap(1),
	},
	title: { paddingLeft: theme.gap(2) },
}));

export default function Root() {
	const { t } = useTranslation();
	const newlyAddedAlbums = useInfiniteQuery(() =>
		getAlbums({}, { sortBy: "addDate", order: "desc" }, [
			"illustration",
			"artist",
		]),
	);
	const newlyAddedArtists = useInfiniteQuery(() =>
		getArtists({}, { sortBy: "addDate", order: "desc" }, ["illustration"]),
	);

	const latestAlbums = useInfiniteQuery(() =>
		getAlbums({}, { sortBy: "releaseDate", order: "desc" }, [
			"illustration",
			"artist",
		]),
	);

	const newlyAddedReleases = useInfiniteQuery(() =>
		getReleases({}, { sortBy: "addDate", order: "desc" }, [
			"illustration",
			"album",
		]),
	);
	useSetKeyIllustration(newlyAddedAlbums.items?.at(0));
	const topSongs = useInfiniteQuery(() =>
		getSongs({}, { sortBy: "userPlayCount", order: "desc" }, [
			"artist",
			"featuring",
			"master",
			"illustration",
		]),
	);
	const sync = useCallback(
		<T,>(q: T) => {
			if (
				!!newlyAddedAlbums.data &&
				!!newlyAddedArtists.data &&
				!!latestAlbums.data &&
				!!topSongs.data &&
				!!newlyAddedReleases.data
			) {
				return q;
			}
			return undefined;
		},
		[
			newlyAddedAlbums.data,
			newlyAddedArtists.data,
			latestAlbums.data,
			topSongs.data,
			newlyAddedReleases.data,
		],
	);
	return (
		<SafeScrollView contentContainerStyle={[styles.main]}>
			<Row
				header={t("home.newlyAddedAlbums")}
				items={sync(newlyAddedAlbums.items)}
				render={(album) => {
					return <AlbumTile album={album} subtitle="artistName" />;
				}}
				seeMore={
					newlyAddedAlbums.hasNextPage
						? {
								pathname: "/albums",
								params: {
									sort: "addDate",
									order: "desc",
								} satisfies Sorting<AlbumSortingKey>,
							}
						: undefined
				}
			/>

			<Row
				header={t("home.newlyAddedArtists")}
				items={sync(newlyAddedArtists.items)}
				render={(artist) => {
					return <ArtistTile artist={artist} />;
				}}
				seeMore={
					newlyAddedArtists.hasNextPage
						? {
								pathname: "/artists",
								params: {
									sort: "addDate",
									order: "desc",
								} satisfies Sorting<ArtistSortingKey>,
							}
						: undefined
				}
			/>
			{/* TODO Featured albums */}

			<Row
				header={t("home.latestAlbums")}
				items={sync(latestAlbums.items)}
				render={(album) => {
					return <AlbumTile album={album} subtitle="artistName" />;
				}}
				seeMore={
					latestAlbums.hasNextPage
						? {
								pathname: "/albums",
								params: {
									sort: "releaseDate",
									order: "desc",
								} satisfies Sorting<AlbumSortingKey>,
							}
						: undefined
				}
			/>

			<Row
				header={t("home.newlyAddedReleases")}
				items={sync(newlyAddedReleases.items)}
				render={(release) => {
					return <ReleaseTile release={release} />;
				}}
			/>

			{/* TODO Genres*/}

			<SongGrid
				seeMore={
					topSongs.hasNextPage
						? {
								pathname: "/songs",
								params: {
									sort: "userPlayCount",
									order: "desc",
								} satisfies Sorting<SongSortingKey>,
							}
						: undefined
				}
				hideIfEmpty
				header={t("home.mostPlayedSongs")}
				songs={sync(topSongs.data?.pages.at(0)?.items)}
				subtitle={() => "artists"}
				style={styles.lastSection}
			/>
		</SafeScrollView>
	);
}
