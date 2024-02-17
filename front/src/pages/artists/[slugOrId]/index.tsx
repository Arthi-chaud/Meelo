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

import { Box, Button, Container, Divider, Grid } from "@mui/material";
import { useRouter } from "next/router";
import API from "../../../api/api";
import { useInfiniteQuery, useQuery } from "../../../api/use-query";
import AlbumTile from "../../../components/tile/album-tile";
import Link from "next/link";
import getSlugOrId from "../../../utils/getSlugOrId";
import { GetPropsTypesFrom, Page } from "../../../ssr";
import TileRow from "../../../components/tile-row";
import getYear from "../../../utils/getYear";
import SectionHeader from "../../../components/section-header";
import VideoTile from "../../../components/tile/video-tile";
import formatDuration from "../../../utils/formatDuration";
import ExternalIdBadge from "../../../components/external-id-badge";
import SongGrid from "../../../components/song-grid";
import { MoreIcon } from "../../../components/icons";
import ResourceDescriptionExpandable from "../../../components/resource-description-expandable";
import ArtistRelationPageHeader from "../../../components/relation-page-header/artist-relation-page-header";
import { AlbumType } from "../../../models/album";
import { Fragment, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { generateArray } from "../../../utils/gen-list";
import { NextPageContext } from "next";
import { useGradientBackground } from "../../../utils/gradient-background";

// Number of Song item in the 'Top Song' section
const songListSize = 6;
// Number of Album item in the 'Latest albums' section
const albumListSize = 10;

const latestAlbumsQuery = AlbumType.map((type) => ({
	type: type,
	query: (artistSlugOrId: string | number) => {
		return API.getAlbums(
			{ artist: artistSlugOrId, type: type },
			{ sortBy: "releaseDate", order: "desc" },
		);
	},
}));

const videosQuery = (artistSlugOrId: string | number) =>
	API.getVideos(
		{ artist: artistSlugOrId },
		{ sortBy: "totalPlayCount", order: "desc" },
	);

const topSongsQuery = (artistSlugOrId: string | number) =>
	API.getSongs(
		{ artist: artistSlugOrId },
		{ sortBy: "totalPlayCount", order: "desc" },
		["artist", "featuring"],
	);

const artistQuery = (artistSlugOrId: string | number) =>
	API.getArtist(artistSlugOrId, ["externalIds"]);

const appearanceQuery = (artistSlugOrId: string | number) =>
	API.getAlbums(
		{ appearance: artistSlugOrId },
		{ sortBy: "releaseDate", order: "desc" },
		["artist"],
	);

const prepareSSR = (context: NextPageContext) => {
	const artistIdentifier = getSlugOrId(context.query);

	return {
		additionalProps: { artistIdentifier },
		queries: [artistQuery(artistIdentifier)],
		infiniteQueries: [
			videosQuery(artistIdentifier),
			topSongsQuery(artistIdentifier),
			appearanceQuery(artistIdentifier),
			...latestAlbumsQuery.map(({ query }) => query(artistIdentifier)),
		],
	};
};

const ArtistPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const sectionPadding = 4;
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const artistIdentifier =
		props?.artistIdentifier ?? getSlugOrId(router.query);
	const artist = useQuery(artistQuery, artistIdentifier);
	const albums = latestAlbumsQuery.map(({ type, query }) => ({
		type: type,
		// eslint-disable-next-line react-hooks/rules-of-hooks
		query: useInfiniteQuery(query, artistIdentifier),
	}));
	const videos = useInfiniteQuery(videosQuery, artistIdentifier);
	const topSongs = useInfiniteQuery(topSongsQuery, artistIdentifier);
	const appearances = useInfiniteQuery(appearanceQuery, artistIdentifier);
	const externalIdWithDescription = artist.data?.externalIds
		.filter(({ provider }) => provider.name.toLowerCase() !== "discogs")
		.find(({ description }) => description !== null);
	const { musicVideos, extras } = useMemo(() => {
		const firstPage = videos.data?.pages.at(0)?.items;
		return {
			musicVideos:
				firstPage?.filter((video) => video.type != "NonMusic") ?? [],
			extras:
				firstPage?.filter((video) => video.type == "NonMusic") ?? [],
		};
	}, [videos]);
	const { GradientBackground } = useGradientBackground(
		artist.data?.illustration?.colors,
	);

	return (
		<Box sx={{ width: "100%" }}>
			<GradientBackground />
			<ArtistRelationPageHeader artist={artist.data} />
			<Grid
				container
				direction="column"
				rowSpacing={sectionPadding}
				sx={{ padding: 2, flex: 1, flexGrow: 1, paddingTop: 8 }}
			>
				{topSongs.data?.pages.at(0)?.items.length != 0 && (
					<>
						<SectionHeader
							heading={topSongs.data ? t("topSongs") : undefined}
							trailing={
								(topSongs.data?.pages.at(0)?.items.length ??
									0) > songListSize ? (
									<Link
										href={`/artists/${artistIdentifier}/songs`}
									>
										<Button
											variant="contained"
											color="secondary"
											endIcon={<MoreIcon />}
											sx={{
												textTransform: "none",
												fontWeight: "bold",
											}}
										>
											{t("seeAll")}
										</Button>
									</Link>
								) : (
									<Box sx={{ padding: 1.2 }} />
								)
							}
						/>
						<Grid
							item
							container
							sx={{
								display: "block",
								flexGrow: 1,
								paddingBottom: sectionPadding,
							}}
						>
							<SongGrid
								parentArtistName={artist.data?.name}
								songs={
									topSongs.data?.pages
										.at(0)
										?.items.slice(0, songListSize) ??
									generateArray(songListSize)
								}
							/>
						</Grid>
					</>
				)}
				{albums
					.map(({ type, query }) => ({
						type,
						queryData: query.data?.pages.at(0)?.items,
					}))
					.filter(
						({ queryData }) =>
							queryData === undefined || queryData.length > 0,
					)
					.map(({ type, queryData }) => (
						<Fragment key={`section-${type}`}>
							<SectionHeader
								key={type}
								heading={
									queryData ? t(`plural${type}`) : undefined
								}
								trailing={
									(queryData?.length ?? 0) > albumListSize ? (
										<Link
											href={`/artists/${artistIdentifier}/albums?type=${type}`}
										>
											<Button
												variant="contained"
												color="secondary"
												endIcon={<MoreIcon />}
												sx={{
													textTransform: "none",
													fontWeight: "bold",
												}}
											>
												{t("seeAll")}
											</Button>
										</Link>
									) : (
										<Box sx={{ padding: 1.2 }} />
									)
								}
							/>
							<Grid
								item
								sx={{ overflowX: "clip", width: "100%" }}
							>
								<TileRow
									tiles={
										(
											queryData?.slice(
												0,
												albumListSize,
											) ?? generateArray(6)
										).map((album, index) => (
											<AlbumTile
												key={index}
												album={
													album && artist.data
														? {
																...album,
																artist: artist.data,
															}
														: undefined
												}
												formatSubtitle={(albumItem) =>
													getYear(
														albumItem.releaseDate,
													)?.toString() ?? ""
												}
											/>
										)) ?? []
									}
								/>
							</Grid>
						</Fragment>
					))}
				{[
					{ label: "topVideos", items: musicVideos } as const,
					{ label: "extras", items: extras } as const,
				].map(
					({ label, items }) =>
						items.length != 0 && (
							<Fragment key={`videos-${label}`}>
								<SectionHeader
									heading={t(label)}
									trailing={
										(items.length ?? 0) > albumListSize ? (
											<Link
												href={`/artists/${artistIdentifier}/videos`}
											>
												<Button
													variant="contained"
													color="secondary"
													endIcon={<MoreIcon />}
													sx={{
														textTransform: "none",
														fontWeight: "bold",
													}}
												>
													{t("seeAll")}
												</Button>
											</Link>
										) : undefined
									}
								/>
								<Grid
									item
									sx={{ overflowX: "clip", width: "100%" }}
								>
									<TileRow
										tiles={
											items
												.slice(0, albumListSize)
												.map(({ track, ...song }) => (
													<VideoTile
														key={track.id}
														video={{
															...track,
															song,
														}}
														formatSubtitle={(
															item,
														) =>
															formatDuration(
																item.duration,
															).toString()
														}
													/>
												)) ?? []
										}
									/>
								</Grid>
							</Fragment>
						),
				)}
				{(appearances.data?.pages?.at(0)?.items.length ?? 0) != 0 && (
					<>
						<Divider sx={{ paddingTop: 4 }} />
						<Box sx={{ paddingBottom: sectionPadding }} />
						<SectionHeader heading={t("appearsOn")} />
						<Grid item sx={{ overflowX: "clip", width: "100%" }}>
							<TileRow
								tiles={
									appearances.data?.pages
										?.at(0)
										?.items.map((album) => (
											<AlbumTile
												key={album.id}
												album={album}
											/>
										)) ?? []
								}
							/>
						</Grid>
					</>
				)}
				<Divider sx={{ paddingTop: 3 }} />
				<Box sx={{ paddingBottom: sectionPadding }} />
				<SectionHeader heading={t("about")} />
				{externalIdWithDescription && (
					<Container
						maxWidth={false}
						sx={{ paddingBottom: 4, paddingTop: 3 }}
					>
						<ResourceDescriptionExpandable
							externalDescription={externalIdWithDescription}
						/>
					</Container>
				)}
				{(!artist.data || artist.data.externalIds.length != 0) && (
					<>
						<Divider />
						<Grid
							container
							item
							spacing={1}
							sx={{ alignItems: "center" }}
						>
							<Grid item sx={{ paddingRight: 3 }}>
								<SectionHeader heading={t("externalLinks")} />
							</Grid>
							{(
								artist.data?.externalIds.filter(
									({ url }) => url !== null,
								) ?? generateArray(2)
							).map((externalId, index) => (
								<Grid item key={index}>
									<ExternalIdBadge externalId={externalId} />
								</Grid>
							)) ?? []}
						</Grid>
					</>
				)}
			</Grid>
		</Box>
	);
};

ArtistPage.prepareSSR = prepareSSR;

export default ArtistPage;
