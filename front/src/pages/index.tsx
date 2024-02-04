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
import API from "../api/api";
import prepareSSR, { InferSSRProps } from "../ssr";
import { useInfiniteQuery } from "../api/use-query";
import SectionHeader from "../components/section-header";
import TileRow from "../components/tile-row";
import AlbumTile from "../components/tile/album-tile";
import ArtistTile from "../components/tile/artist-tile";
import SongGrid from "../components/song-grid";
import ReleaseTile from "../components/tile/release-tile";
import Fade from "../components/fade";
import AlbumHighlightCard from "../components/highlight-card/album-highlight-card";
import GradientBackground from "../components/gradient-background";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { generateArray } from "../utils/gen-list";

const newlyAddedAlbumsQuery = API.getAlbums(
	{},
	{ sortBy: "addDate", order: "desc" },
	["artist"],
);

const newestAlbumsQuery = API.getAlbums(
	{},
	{ sortBy: "releaseDate", order: "desc" },
	["artist"],
);

const newlyAddedArtistsQuery = API.getArtists(
	{},
	{ sortBy: "addDate", order: "desc" },
);

const newlyAddedReleasesQuery = API.getReleases(
	{},
	{ sortBy: "addDate", order: "desc" },
	["album"],
);

const mostListenedSongsQuery = API.getSongs(
	{},
	{ sortBy: "userPlayCount", order: "desc" },
	["artist", "featuring"],
);

const albumRecommendations = (seed: number) =>
	API.getAlbums({ random: seed, type: "StudioRecording" }, undefined, [
		"artist",
		"genres",
		"externalIds",
	]);

const HomePageSection = <T,>(props: {
	heading: string | JSX.Element;
	queryData: { data?: { pages?: { items?: T[] }[] } };
	render: (items: (T | undefined)[]) => JSX.Element;
}) => {
	const items = props.queryData.data?.pages?.at(0)?.items;

	// Remove the section if its content is empty
	if (items !== undefined && items.length == 0) {
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

export const getServerSideProps = prepareSSR(() => {
	const seed = Math.floor(Math.random() * 10000000);

	return {
		additionalProps: {
			blurhashIndex: Math.random(),
			recommendationSeed: seed,
		},
		infiniteQueries: [
			newlyAddedArtistsQuery,
			newestAlbumsQuery,
			newlyAddedAlbumsQuery,
			newlyAddedReleasesQuery,
			mostListenedSongsQuery,
			albumRecommendations(seed),
		],
	};
});

const HomePage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const newlyAddedAlbums = useInfiniteQuery(() => newlyAddedAlbumsQuery);
	const newlyAddedArtists = useInfiniteQuery(() => newlyAddedArtistsQuery);
	const newlyAddedReleases = useInfiniteQuery(() => newlyAddedReleasesQuery);
	const mostListenedSongs = useInfiniteQuery(() => mostListenedSongsQuery);
	const newestAlbums = useInfiniteQuery(() => newestAlbumsQuery);
	const { t } = useTranslation();
	const featuredAlbums = useInfiniteQuery(
		albumRecommendations,
		props.additionalProps?.recommendationSeed ??
			Math.floor(Math.random() * 10000000),
	);
	const tileRowWindowSize = {
		xs: 3,
		sm: 4,
		md: 5,
		lg: 6,
		xl: 10,
	};
	const queries = [
		newlyAddedAlbums,
		newestAlbums,
		newlyAddedArtists,
		mostListenedSongs,
		newlyAddedReleases,
	];
	const illustrations = queries
		.map((query) => query.data?.pages.at(0)?.items ?? [])
		.flat()
		.map(({ illustration }) => illustration)
		.filter((illustration) => illustration !== null);
	const selectedIllustrationColor = useMemo(() => {
		return illustrations.at(
			illustrations.length * (props.additionalProps?.blurhashIndex ?? 0),
		)?.colors;
	}, [illustrations, props.additionalProps]);

	return (
		<>
			<GradientBackground colors={selectedIllustrationColor} />
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
										<AlbumHighlightCard album={album} />
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

export default HomePage;
