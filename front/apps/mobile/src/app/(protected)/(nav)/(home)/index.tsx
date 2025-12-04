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

import { FlashList } from "@shopify/flash-list";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, type ScrollViewProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
	getAlbums,
	getArtists,
	getGenres,
	getReleases,
	getSongs,
} from "@/api/queries";
import type { AlbumSortingKey, AlbumWithRelations } from "@/models/album";
import type { ArtistSortingKey, ArtistWithRelations } from "@/models/artist";
import type Genre from "@/models/genre";
import type { SongSortingKey } from "@/models/song";
import { generateArray } from "@/utils/gen-list";
import { useInfiniteQuery } from "~/api";
import { useSetKeyIllustration } from "~/components/background-gradient";
import { AlbumTile } from "~/components/item/resource/album";
import { ArtistTile } from "~/components/item/resource/artist";
import { GenreChip } from "~/components/item/resource/genre";
import ReleaseTile from "~/components/item/resource/release";
import { Row, type RowProps } from "~/components/row";
import { SongGrid, type SongGridProps } from "~/components/song-grid";
import { Text } from "~/primitives/text";
import type { Sorting } from "~/utils/sorting";

const styles = StyleSheet.create((theme) => ({
	main: { paddingTop: theme.gap(2), gap: theme.gap(2) },
	lastSection: {
		paddingBottom: theme.gap(1),
	},
	title: { paddingLeft: theme.gap(2) },
	genreRow: {
		gap: theme.gap(1),
		alignItems: "center",
		paddingLeft: theme.gap(2),
		marginBottom: theme.gap(1),
	},
}));

type HomePageSection =
	| { type: "tileRow"; props: RowProps<any> }
	| { type: "genreRow"; props: ScrollViewProps }
	| { type: "songGrid"; props: SongGridProps };

const renderHomePageSection = (s: HomePageSection) => {
	switch (s.type) {
		case "songGrid":
			return <SongGrid {...s.props} />;
		case "tileRow":
			return <Row {...s.props} />;
		case "genreRow":
			return <ScrollView {...s.props} />;
	}
};

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

	const topGenres = useInfiniteQuery(() =>
		getGenres({}, { sortBy: "songCount", order: "desc" }),
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

	const sections: HomePageSection[] = [
		{
			type: "tileRow",
			props: {
				header: t("home.newlyAddedAlbums"),
				items: sync(newlyAddedAlbums.items),
				render: (album) => {
					return <AlbumTile album={album} subtitle="artistName" />;
				},
				seeMore: newlyAddedAlbums.hasNextPage
					? {
							pathname: "/albums",
							params: {
								sort: "addDate",
								order: "desc",
							} satisfies Sorting<AlbumSortingKey>,
						}
					: undefined,
			} satisfies RowProps<AlbumWithRelations<"illustration" | "artist">>,
		},
		/* TODO Featured albums */
		{
			type: "tileRow",
			props: {
				header: t("home.newlyAddedArtists"),
				items: sync(newlyAddedArtists.items),
				render: (artist) => {
					return <ArtistTile artist={artist} />;
				},
				seeMore: newlyAddedArtists.hasNextPage
					? {
							pathname: "/artists",
							params: {
								sort: "addDate",
								order: "desc",
							} satisfies Sorting<ArtistSortingKey>,
						}
					: undefined,
			} satisfies RowProps<ArtistWithRelations<"illustration">>,
		},
		{
			type: "tileRow",
			props: {
				header: t("home.latestAlbums"),
				items: sync(latestAlbums.items),
				render: (album) => {
					return <AlbumTile album={album} subtitle="artistName" />;
				},
				seeMore: latestAlbums.hasNextPage
					? {
							pathname: "/albums",
							params: {
								sort: "releaseDate",
								order: "desc",
							} satisfies Sorting<AlbumSortingKey>,
						}
					: undefined,
			} satisfies RowProps<AlbumWithRelations<"illustration" | "artist">>,
		},
		{
			type: "tileRow",
			props: {
				header: t("home.newlyAddedReleases"),
				items: sync(newlyAddedReleases.items),
				render: (release) => {
					return <ReleaseTile release={release} />;
				},
			},
		},
		{
			type: "genreRow",
			props: {
				horizontal: true,
				contentContainerStyle: styles.genreRow,
				children: (
					<>
						<Text content={t("home.topGenres")} variant="h4" />
						{(topGenres.items ?? generateArray(3, undefined)).map(
							(genre: Genre | undefined, idx) => (
								<GenreChip
									genre={genre}
									key={genre?.slug ?? idx}
								/>
							),
						)}
					</>
				),
			},
		},
		{
			type: "songGrid",
			props: {
				seeMore: topSongs.hasNextPage
					? {
							pathname: "/songs",
							params: {
								sort: "userPlayCount",
								order: "desc",
							} satisfies Sorting<SongSortingKey>,
						}
					: undefined,
				hideIfEmpty: true,
				header: t("home.mostPlayedSongs"),
				songs: sync(topSongs.data?.pages.at(0)?.items),
				subtitle: () => "artists",
				style: styles.lastSection,
			},
		},
	];
	return (
		<FlashList
			data={sections}
			getItemType={(t) => t.type}
			renderItem={({ item }) => renderHomePageSection(item)}
			contentContainerStyle={styles.main}
		/>
	);
}
