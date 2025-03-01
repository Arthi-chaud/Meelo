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

import { Box, Grid, Stack } from "@mui/material";
import type { NextPageContext } from "next";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { QueryClient } from "react-query";
import API from "../api/api";
import {
	prepareMeeloInfiniteQuery,
	useInfiniteQuery,
	useQueries,
	type useQuery,
} from "../api/use-query";
import { GoToSettingsAction } from "../components/actions/link";
import { EmptyState } from "../components/empty-state";
import Fade from "../components/fade";
import AlbumHighlightCard from "../components/highlight-card/album-highlight-card";
import { EmptyStateIcon } from "../components/icons";
import SectionHeader from "../components/section-header";
import SongGrid from "../components/song-grid";
import TileRow from "../components/tile-row";
import AlbumTile from "../components/tile/album-tile";
import ArtistTile from "../components/tile/artist-tile";
import ReleaseTile from "../components/tile/release-tile";
import type { AlbumExternalMetadata } from "../models/external-metadata";
import type { GetPropsTypesFrom, Page } from "../ssr";
import { generateArray } from "../utils/gen-list";
import { useGradientBackground } from "../utils/gradient-background";
import { getRandomNumber } from "../utils/random";

const newlyAddedAlbumsQuery = API.getAlbums(
	{},
	{ sortBy: "addDate", order: "desc" },
	["artist", "illustration"],
);

const newestAlbumsQuery = API.getAlbums(
	{},
	{ sortBy: "releaseDate", order: "desc" },
	["artist", "illustration"],
);

const newlyAddedArtistsQuery = API.getArtists(
	{},
	{ sortBy: "addDate", order: "desc" },
	["illustration"],
);

const newlyAddedReleasesQuery = API.getReleases(
	{},
	{ sortBy: "addDate", order: "desc" },
	["album", "illustration"],
);

const mostListenedSongsQuery = API.getSongs(
	{},
	{ sortBy: "userPlayCount", order: "desc" },
	["artist", "featuring", "master", "illustration"],
);

const albumRecommendations = (seed: number) =>
	API.getAlbums({ random: seed, type: "StudioRecording" }, undefined, [
		"artist",
		"genres",
		"illustration",
	]);

const HomePageSection = <T,>(props: {
	heading: string | JSX.Element;
	queryData: { items?: T[] };
	render: (items: (T | undefined)[]) => JSX.Element;
}) => {
	const items = props.queryData.items;

	// Remove the section if its content is empty
	if (items !== undefined && items.length === 0) {
		return <></>;
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
	const albumRecs = await queryClient
		.fetchInfiniteQuery(
			prepareMeeloInfiniteQuery(() => albumRecommendations(seed)),
		)
		.then((res) => res.pages.at(0)?.items);

	return {
		additionalProps: {
			blurhashIndex: Math.random(),
			recommendationSeed: seed,
		},
		queries: albumRecs?.map((album) =>
			API.getAlbumExternalMetadata(album.id),
		),
		infiniteQueries: [
			newlyAddedArtistsQuery,
			newestAlbumsQuery,
			newlyAddedAlbumsQuery,
			newlyAddedReleasesQuery,
			mostListenedSongsQuery,
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
					Parameters<typeof API.getAlbumExternalMetadata>
				>
			> => [API.getAlbumExternalMetadata, album.id],
		) ?? []),
	);

	const newlyAddedAlbums = useInfiniteQuery(() => newlyAddedAlbumsQuery);
	const newlyAddedArtists = useInfiniteQuery(() => newlyAddedArtistsQuery);
	const newlyAddedReleases = useInfiniteQuery(() => newlyAddedReleasesQuery);
	const mostListenedSongs = useInfiniteQuery(() => mostListenedSongsQuery);
	const newestAlbums = useInfiniteQuery(() => newestAlbumsQuery);
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
		.flatMap((query) => query.items ?? [])
		.map(({ illustration }) => illustration)
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
						text="emptyStateHome"
						actions={[
							{
								...GoToSettingsAction,
								label: "goToSettingsPage",
							},
						]}
					/>
				</Box>
			)}
			<Fade in>
				<Stack spacing={4} my={2}>
					<HomePageSection
						heading={t("newlyAddedAlbums")}
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
						heading={t("newlyAddedArtists")}
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
						heading={t("featuredAlbums")}
						queryData={featuredAlbums}
						render={(albums) => (
							<Grid container spacing={3}>
								{albums.slice(0, 6).map((album, index) => (
									<Grid
										item
										xs={12}
										lg={6}
										xl={4}
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
						heading={t("latestAlbums")}
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
						heading={t("newlyAddedReleases")}
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
						heading={t("mostPlayedSongs")}
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
