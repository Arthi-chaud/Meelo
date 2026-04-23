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

import { FlashList, type FlashListProps } from "@shopify/flash-list";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
	getAlbums,
	getArtists,
	getCurrentUserStatus,
	getGenres,
	getLabels,
	getReleases,
	getSongs,
} from "@/api/queries";
import type { AlbumSortingKey, AlbumWithRelations } from "@/models/album";
import type { ArtistSortingKey, ArtistWithRelations } from "@/models/artist";
import type { SongSortingKey } from "@/models/song";
import { EmptyStateIcon } from "@/ui/icons";
import { generateArray } from "@/utils/gen-list";
import { useInfiniteQuery, useQuery } from "~/api";
import { useSetKeyIllustration } from "~/components/background-gradient";
import { EmptyState } from "~/components/empty-state";
import { GoToWebSettingsButton } from "~/components/go-to-web";
import { StaticHeader } from "~/components/header";
import { AlbumTile } from "~/components/item/resource/album";
import { ArtistTile } from "~/components/item/resource/artist";
import { GenreChip } from "~/components/item/resource/genre";
import { LabelChip } from "~/components/item/resource/label";
import ReleaseTile from "~/components/item/resource/release";
import { Row, type RowProps } from "~/components/row";
import { SafeFlashList, SafeView } from "~/components/safe-view";
import { SongGrid, type SongGridProps } from "~/components/song-grid";
import { Text } from "~/primitives/text";
import type { Sorting } from "~/utils/sorting";

const styles = StyleSheet.create((theme) => ({
	main: { gap: theme.gap(2) },
	emptyState: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: theme.gap(1),
	},
	lastSection: {
		paddingBottom: theme.gap(1),
	},
	title: { paddingLeft: theme.gap(2) },
	chipRow: {
		alignItems: "center",
		paddingHorizontal: theme.gap(2),
		paddingVertical: theme.gap(1),
		marginBottom: theme.gap(1),
	},
	chip: {
		paddingLeft: theme.gap(1.5),
		alignItems: "center",
	},
}));

type HomePageSection =
	| { type: "tileRow"; props: RowProps<any> }
	| { type: "chipRow"; props: FlashListProps<any | undefined> }
	| { type: "songGrid"; props: SongGridProps };

const renderHomePageSection = (s: HomePageSection) => {
	switch (s.type) {
		case "songGrid":
			return <SongGrid {...s.props} />;
		case "tileRow":
			return <Row {...s.props} />;
		case "chipRow":
			return <FlashList {...s.props} />;
	}
};

export default function Root() {
	const { t } = useTranslation();
	const newlyAddedAlbums = useInfiniteQuery(() =>
		getAlbums({}, { sortBy: "addDate", order: "desc" }, [
			"illustration",
			"artists",
		]),
	);
	const newlyAddedArtists = useInfiniteQuery(() =>
		getArtists({}, { sortBy: "addDate", order: "desc" }, ["illustration"]),
	);

	const latestAlbums = useInfiniteQuery(() =>
		getAlbums({}, { sortBy: "releaseDate", order: "desc" }, [
			"illustration",
			"artists",
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

	const topLabels = useInfiniteQuery(() =>
		getLabels({}, { sortBy: "albumCount", order: "desc" }),
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
	const queries = [
		newlyAddedAlbums,
		newlyAddedArtists,
		latestAlbums,
		topSongs,
		newlyAddedReleases,
	];
	const refresh = useCallback(
		() =>
			queries.forEach((q) => {
				q.refetch();
			}),
		[queries],
	);
	const sync = useCallback(
		<T,>(q: T) => {
			if (queries.find((q1) => q1.data === undefined)) {
				return undefined;
			}
			return q;
		},
		[queries],
	);
	const { data: user } = useQuery(getCurrentUserStatus);

	const sections: HomePageSection[] = [
		{
			type: "tileRow",
			props: {
				header: t("home.newlyAddedAlbums"),
				items: sync(newlyAddedAlbums.items),
				hideIfEmpty: true,
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
			} satisfies RowProps<
				AlbumWithRelations<"illustration" | "artists">
			>,
		},
		/* TODO Featured albums */
		{
			type: "tileRow",
			props: {
				header: t("home.newlyAddedArtists"),
				hideIfEmpty: true,
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
				hideIfEmpty: true,
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
			} satisfies RowProps<
				AlbumWithRelations<"illustration" | "artists">
			>,
		},
		{
			type: "tileRow",
			props: {
				header: t("home.newlyAddedReleases"),
				items: sync(newlyAddedReleases.items),
				hideIfEmpty: true,
				render: (release) => {
					return <ReleaseTile release={release} />;
				},
			},
		},

		...(topLabels.items?.length
			? [
					{
						type: "chipRow",
						props: {
							horizontal: true,
							data:
								topGenres.items ?? generateArray(1, undefined),
							ListHeaderComponent: (
								<Text
									content={t("home.topGenres")}
									variant="h4"
								/>
							),
							CellRendererComponent: (props) => {
								return (
									<View
										{...props}
										style={[styles.chip, props.style]}
									/>
								);
							},
							renderItem: ({ item: genre, index }) => (
								<GenreChip
									genre={genre}
									key={genre?.slug ?? index}
								/>
							),

							contentContainerStyle: styles.chipRow,
						},
					} satisfies HomePageSection,
				]
			: []),

		...(topLabels.items?.length
			? [
					{
						type: "chipRow",
						props: {
							horizontal: true,
							data:
								topLabels.items ?? generateArray(1, undefined),

							ListHeaderComponent: (
								<Text
									content={t("home.topLabels")}
									variant="h4"
								/>
							),
							CellRendererComponent: (props) => {
								return (
									<View
										{...props}
										style={[styles.chip, props.style]}
									/>
								);
							},
							renderItem: ({ item: label, index }) => (
								<LabelChip
									label={label}
									key={label?.slug ?? index}
								/>
							),

							contentContainerStyle: styles.chipRow,
						},
					} satisfies HomePageSection,
				]
			: []),
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
	const isEmpty = useMemo(() => {
		return queries.every((q) => q.data?.pages.at(0)?.items.length === 0);
	}, [queries]);
	return (
		<StaticHeader>
			{(scrollRef) =>
				isEmpty ? (
					<SafeView style={[styles.main, styles.emptyState]}>
						<EmptyState
							icon={EmptyStateIcon}
							text="emptyState.home"
						/>
						{user?.admin && <GoToWebSettingsButton />}
					</SafeView>
				) : (
					<SafeFlashList
						ref={scrollRef}
						data={sections}
						refreshing={!!queries.find((q) => q.isRefetching)}
						onRefresh={refresh}
						getItemType={(t) => t.type}
						renderItem={({ item }) => renderHomePageSection(item)}
						contentContainerStyle={[styles.main]}
					/>
				)
			}
		</StaticHeader>
	);
}
