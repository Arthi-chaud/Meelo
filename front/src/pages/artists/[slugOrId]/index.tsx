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
import Album, { AlbumType } from "../../../models/album";
import { Fragment, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { generateArray } from "../../../utils/gen-list";
import { NextPageContext } from "next";
import { useGradientBackground } from "../../../utils/gradient-background";
import Fade from "../../../components/fade";
import { TranslationKey } from "../../../i18n/i18n";
import { UseInfiniteQueryResult, UseQueryResult } from "react-query";
import Artist from "../../../models/artist";
import Song from "../../../models/song";
import Video from "../../../models/video";
import { RequireExactlyOne } from "type-fest";

// Number of Song item in the 'Top Song' section
const songListSize = 6;
// Number of Album item in the 'Latest albums' section
const albumListSize = 10;

const SectionPadding = 4;

const latestAlbumsQuery = AlbumType.map((type) => ({
	type: type,
	query: (artistSlugOrId: string | number) => {
		return API.getAlbums(
			{ artist: artistSlugOrId, type: type },
			{ sortBy: "releaseDate", order: "desc" },
			["illustration"],
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
		["artist", "featuring", "master", "illustration"],
	);

const rareSongsQuery = (artistSlugOrId: string | number) =>
	API.getSongs(
		{ rare: artistSlugOrId },
		{ sortBy: "releaseDate", order: "desc" },
		["artist", "featuring", "master", "illustration"],
	);

const artistQuery = (artistSlugOrId: string | number) =>
	API.getArtist(artistSlugOrId, ["externalIds", "illustration"]);

const appearanceQuery = (artistSlugOrId: string | number) =>
	API.getAlbums(
		{ appearance: artistSlugOrId },
		{ sortBy: "releaseDate", order: "desc" },
		["artist", "illustration"],
	);

const prepareSSR = (context: NextPageContext) => {
	const artistIdentifier = getSlugOrId(context.query);

	return {
		additionalProps: { artistIdentifier },
		queries: [artistQuery(artistIdentifier)],
		infiniteQueries: [
			rareSongsQuery(artistIdentifier),
			videosQuery(artistIdentifier),
			topSongsQuery(artistIdentifier),
			appearanceQuery(artistIdentifier),
			...latestAlbumsQuery.map(({ query }) => query(artistIdentifier)),
		],
	};
};

const PageSection = <
	T,
	ResourceName = T extends Album
		? "album"
		: T extends Song
			? "song"
			: T extends Video
				? "video"
				: never,
>(
	props: {
		title: TranslationKey;
		artist: UseQueryResult<Artist>;
		seeMoreHref: string;
		layout: "songGrid" | "scroll";
		resourceType: ResourceName;
	} & RequireExactlyOne<{
		query: UseInfiniteQueryResult<{ items: T[] }>;
		items: T[] | undefined;
	}>,
) => {
	const { t } = useTranslation();
	const maxItemCount =
		props.layout === "songGrid" ? songListSize : albumListSize;
	const data = props.query?.data || props.items;
	const firstPage = props.query?.data?.pages.at(0)?.items ?? props.items;
	return (
		<>
			{firstPage?.length != 0 && (
				<>
					<SectionHeader
						heading={
							data !== undefined ? t(props.title) : undefined
						}
						trailing={
							<Fade in={(firstPage?.length ?? 0) > maxItemCount}>
								<Link href={props.seeMoreHref}>
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
							</Fade>
						}
					/>
					{props.layout === "songGrid" ? (
						<Grid
							item
							container
							sx={{
								display: "block",
								flexGrow: 1,
							}}
						>
							<SongGrid
								parentArtistName={props.artist.data?.name}
								songs={
									firstPage?.slice(0, songListSize) ??
									generateArray(songListSize)
								}
							/>
						</Grid>
					) : (
						<Grid item sx={{ overflowX: "clip", width: "100%" }}>
							<TileRow
								tiles={(
									firstPage?.slice(0, albumListSize) ??
									generateArray(6)
								).map((item, index) => (
									<>
										{props.resourceType === "album" && (
											<AlbumTile
												key={index}
												album={
													item && props.artist?.data
														? {
																...item,
																artist: props
																	.artist
																	?.data,
															}
														: undefined
												}
												formatSubtitle={(albumItem) =>
													getYear(
														albumItem.releaseDate,
													)?.toString() ?? ""
												}
											/>
										)}
										{props.resourceType === "video" && (
											<VideoTile
												key={item.track.id}
												video={item}
												formatSubtitle={({
													duration,
												}) =>
													formatDuration(
														duration,
													).toString()
												}
											/>
										)}
									</>
								))}
							/>
						</Grid>
					)}
					<Box sx={{ paddingBottom: SectionPadding }} />
				</>
			)}
		</>
	);
};

const ArtistPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const { t } = useTranslation();
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
	const rareSongs = useInfiniteQuery(rareSongsQuery, artistIdentifier);
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
				rowSpacing={SectionPadding}
				sx={{ padding: 2, flex: 1, flexGrow: 1, paddingTop: 8 }}
			>
				<PageSection
					title={"topSongs"}
					artist={artist}
					seeMoreHref={`/artists/${artistIdentifier}/songs`}
					layout={"songGrid"}
					resourceType={"song"}
					query={topSongs}
				/>
				{albums
					.map(({ type, query }) => ({
						type,
						query,
						queryData: query.data?.pages.at(0)?.items,
					}))
					.filter(
						({ queryData }) =>
							queryData === undefined || queryData.length > 0,
					)
					.map(({ type, query }) => (
						<Fragment key={`section-${type}`}>
							<PageSection
								title={`plural${type}`}
								artist={artist}
								resourceType={"album"}
								seeMoreHref={`/artists/${artistIdentifier}/albums?type=${type}`}
								layout={"scroll"}
								query={query}
							/>
						</Fragment>
					))}
				<PageSection
					title={"rareSongs"}
					artist={artist}
					seeMoreHref={`/artists/${artistIdentifier}/rare-songs`}
					layout={"songGrid"}
					resourceType={"song"}
					query={rareSongs}
				/>
				{[
					{ label: "topVideos", items: musicVideos } as const,
					{ label: "extras", items: extras } as const,
				].map(
					({ label, items }) =>
						items.length != 0 && (
							<Fragment key={`videos-${label}`}>
								<PageSection
									title={label}
									artist={artist}
									seeMoreHref={`/artists/${artistIdentifier}/videos`}
									layout={"scroll"}
									resourceType={"video"}
									items={items}
								/>
							</Fragment>
						),
				)}
				{(appearances.data?.pages?.at(0)?.items.length ?? 0) != 0 && (
					<>
						<Divider />
						<Box sx={{ paddingBottom: SectionPadding }} />
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
				{externalIdWithDescription && (
					<>
						<Divider />
						<Box sx={{ paddingBottom: SectionPadding }} />
						<SectionHeader heading={t("about")} />
						<Container
							maxWidth={false}
							sx={{ paddingBottom: 4, paddingTop: 3 }}
						>
							<ResourceDescriptionExpandable
								externalDescription={externalIdWithDescription}
							/>
						</Container>
					</>
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
