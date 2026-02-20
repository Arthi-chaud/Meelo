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

import { Box, Button, Grid, Skeleton, Stack } from "@mui/material";
import type { QueryClient } from "@tanstack/react-query";
import type { NextPageContext } from "next";
import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GetPropsTypesFrom, Page } from "ssr";
import {
	getAlbumExternalMetadata,
	getAlbums,
	getArtists,
	getGenres,
	getLabels,
	getReleases,
	getSongs,
} from "@/api/queries";
import { toTanStackInfiniteQuery } from "@/api/query";
import type { AlbumExternalMetadata } from "@/models/external-metadata";
import { EmptyStateIcon } from "@/ui/icons";
import { generateArray } from "@/utils/gen-list";
import { getRandomNumber } from "@/utils/random";
import { getAPI, useInfiniteQuery, useQueries, type useQuery } from "~/api";
import { GoToSettingsAction } from "~/components/actions/link";
import { EmptyState } from "~/components/empty-state";
import Fade from "~/components/fade";
import { useGradientBackground } from "~/components/gradient-background";
import AlbumHighlightCard from "~/components/highlight-card/resource/album";
import SectionHeader from "~/components/section-header";
import SongGrid from "~/components/song-grid";
import AlbumTile from "~/components/tile/resource/album";
import ArtistTile from "~/components/tile/resource/artist";
import { GenreTile } from "~/components/tile/resource/genre";
import ReleaseTile from "~/components/tile/resource/release";
import TileRow from "~/components/tile/row";

const newlyAddedAlbumsQuery = getAlbums(
	{},
	{ sortBy: "addDate", order: "desc" },
	["artist", "illustration"],
);

const newestAlbumsQuery = getAlbums(
	{},
	{ sortBy: "releaseDate", order: "desc" },
	["artist", "illustration"],
);

const newlyAddedArtistsQuery = getArtists(
	{},
	{ sortBy: "addDate", order: "desc" },
	["illustration"],
);

const newlyAddedReleasesQuery = getReleases(
	{},
	{ sortBy: "addDate", order: "desc" },
	["album", "illustration"],
);

const mostListenedSongsQuery = getSongs(
	{},
	{ sortBy: "userPlayCount", order: "desc" },
	["artist", "featuring", "master", "illustration"],
);

const albumRecommendations = (seed: number) =>
	getAlbums({ random: seed, type: ["StudioRecording"] }, undefined, [
		"artist",
		"genres",
		"illustration",
	]);

const topGenresQuery = getGenres({}, { sortBy: "songCount", order: "desc" });

const topLabelsQuery = getLabels({}, { sortBy: "albumCount", order: "desc" });

const HomePageSection = <T,>(props: {
	heading: string | ReactNode;
	queryData: { items?: T[] };
	render: (items: (T | undefined)[]) => ReactNode;
}) => {
	const items = props.queryData.items;

	// Remove the section if its content is empty
	if (items !== undefined && items.length === 0) {
		return null;
	}
	return (
		<Stack spacing={3}>
			<SectionHeader heading={props.heading} />
			<Box sx={{ maxHeight: "20%" }}>
				{props.render(items?.slice(0, 12) ?? generateArray(6))}
			</Box>
		</Stack>
	);
};

const prepareSSR = async (_: NextPageContext, queryClient: QueryClient) => {
	const seed = Math.floor(Math.random() * 10000000);
	const api = getAPI();
	const albumRecs = await queryClient
		.fetchInfiniteQuery(
			toTanStackInfiniteQuery(api, () => albumRecommendations(seed)),
		)
		.then((res) => res.pages.at(0)?.items);

	return {
		additionalProps: {
			blurhashIndex: Math.random(),
			recommendationSeed: seed,
		},
		queries: albumRecs?.map((album) => getAlbumExternalMetadata(album.id)),
		infiniteQueries: [
			newlyAddedArtistsQuery,
			newestAlbumsQuery,
			newlyAddedAlbumsQuery,
			newlyAddedReleasesQuery,
			mostListenedSongsQuery,
			topGenresQuery,
			topLabelsQuery,
		],
	};
};

const HomePage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const [seed] = useState(Math.floor(Math.random() * 10000000));
	const [blurhashIndex] = useState(getRandomNumber());
	const featuredAlbums = useInfiniteQuery(
		albumRecommendations,
		props?.recommendationSeed ?? seed,
	);
	const featuredAlbumsExternalMetadata = useQueries(
		...(featuredAlbums.items?.map(
			(
				album,
			): Parameters<
				typeof useQuery<
					AlbumExternalMetadata | null,
					Parameters<typeof getAlbumExternalMetadata>
				>
			> => [getAlbumExternalMetadata, album.id],
		) ?? []),
	);

	const newlyAddedAlbums = useInfiniteQuery(() => newlyAddedAlbumsQuery);
	const newlyAddedArtists = useInfiniteQuery(() => newlyAddedArtistsQuery);
	const newlyAddedReleases = useInfiniteQuery(() => newlyAddedReleasesQuery);
	const mostListenedSongs = useInfiniteQuery(() => mostListenedSongsQuery);
	const newestAlbums = useInfiniteQuery(() => newestAlbumsQuery);
	const topGenres = useInfiniteQuery(() => topGenresQuery);
	const topLabels = useInfiniteQuery(() => topLabelsQuery);
	const { t } = useTranslation();
	const tileRowWindowSize = {
		xs: 3,
		sm: 4,
		md: 4,
		lg: 6,
		xl: 8,
	};
	const queries = [
		newlyAddedAlbums,
		newestAlbums,
		newlyAddedArtists,
		mostListenedSongs,
		newlyAddedReleases,
	];

	const allIsEmpty = useMemo(() => {
		for (const q of [...queries, featuredAlbums]) {
			if (q.items === undefined) {
				return false;
			}
			if (q.items.length !== 0) {
				return false;
			}
		}
		return true;
	}, [queries, featuredAlbums]);
	const illustrations = queries
		.flatMap(
			(query) =>
				query.items?.map(({ illustration }) => illustration) ?? [],
		)
		.filter((illustration) => illustration !== null);
	const selectedIllustrationColor = useMemo(() => {
		return illustrations.at(
			illustrations.length * (props?.blurhashIndex ?? blurhashIndex),
		)?.colors;
	}, [illustrations, props?.blurhashIndex]);
	const { GradientBackground } = useGradientBackground(
		selectedIllustrationColor,
	);

	return (
		<>
			<GradientBackground />

			{allIsEmpty && (
				<Box
					sx={{
						height: "100%",
						display: "flex",
						alignItems: "center",
					}}
				>
					<EmptyState
						icon={<EmptyStateIcon />}
						text="emptyState.home"
						actions={[
							{
								...GoToSettingsAction,
								label: "actions.goToSettingsPage",
							},
						]}
					/>
				</Box>
			)}
			<Fade in>
				<Stack spacing={4} my={2}>
					<HomePageSection
						heading={t("home.newlyAddedAlbums")}
						queryData={newlyAddedAlbums}
						render={(albums) => (
							<TileRow
								tiles={albums.map((album, index) => (
									<AlbumTile key={index} album={album} />
								))}
								windowSize={tileRowWindowSize}
							/>
						)}
					/>
					<HomePageSection
						heading={t("home.newlyAddedArtists")}
						queryData={newlyAddedArtists}
						render={(artists) => (
							<TileRow
								tiles={artists.map((artist, index) => (
									<ArtistTile key={index} artist={artist} />
								))}
								windowSize={tileRowWindowSize}
							/>
						)}
					/>
					<HomePageSection
						heading={t("home.featuredAlbums")}
						queryData={featuredAlbums}
						render={(albums) => (
							<Grid container spacing={3}>
								{albums.slice(0, 6).map((album, index) => (
									<Grid
										size={{ xs: 12, lg: 6, xl: 4 }}
										key={index}
									>
										<AlbumHighlightCard
											album={album}
											externalMetadata={
												featuredAlbumsExternalMetadata.find(
													({ data }) =>
														data?.albumId ===
														album?.id,
												)?.data ?? undefined
											}
										/>
									</Grid>
								))}
							</Grid>
						)}
					/>
					<HomePageSection
						heading={t("home.latestAlbums")}
						queryData={newestAlbums}
						render={(albums) => (
							<TileRow
								tiles={albums.map((album, index) => (
									<AlbumTile key={index} album={album} />
								))}
								windowSize={tileRowWindowSize}
							/>
						)}
					/>
					<HomePageSection
						heading={t("home.newlyAddedReleases")}
						queryData={newlyAddedReleases}
						render={(releases) => (
							<TileRow
								tiles={releases.map((release, idx) => (
									<ReleaseTile key={idx} release={release} />
								))}
								windowSize={tileRowWindowSize}
							/>
						)}
					/>

					<HomePageSection
						heading={t("home.topGenres")}
						queryData={topGenres}
						render={(genres) => (
							<TileRow
								tiles={genres.map((genre, index) => (
									<Box
										sx={{ paddingBottom: 2 }}
										key={`genre-${genre?.id}-${index}`}
									>
										<GenreTile key={index} genre={genre} />
									</Box>
								))}
								windowSize={tileRowWindowSize}
							/>
						)}
					/>

					<HomePageSection
						heading={t("home.topLabels")}
						queryData={topLabels}
						render={(labels) => (
							<TileRow
								tiles={labels.map((label, index) => (
									<Box
										sx={{ paddingBottom: 2 }}
										key={`label-${label?.id}-${index}`}
									>
										<Link
											href={
												label
													? `/labels/${label.slug}`
													: {}
											}
										>
											<Button
												variant="outlined"
												size="large"
												sx={{
													width: "100%",
													textTransform: "none",
												}}
											>
												{!label ? (
													<Skeleton width={"50px"} />
												) : (
													label.name
												)}
											</Button>
										</Link>
									</Box>
								))}
								windowSize={tileRowWindowSize}
							/>
						)}
					/>
					<HomePageSection
						heading={t("home.mostPlayedSongs")}
						queryData={mostListenedSongs}
						render={(songs) => <SongGrid songs={songs} />}
					/>
				</Stack>
			</Fade>
		</>
	);
};

HomePage.prepareSSR = prepareSSR;

export default HomePage;
