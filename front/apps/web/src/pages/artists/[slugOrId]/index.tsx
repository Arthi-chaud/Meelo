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

import { Box, Container, Divider, Grid, Stack } from "@mui/material";
import type { NextPageContext } from "next";
import { useRouter } from "next/router";
import { Fragment, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { GetPropsTypesFrom, Page } from "ssr";
import {
	getAlbums,
	getArtist,
	getArtistExternalMetadata,
	getSongs,
	getVideos,
} from "@/api/queries";
import { AlbumType } from "@/models/album";
import { albumTypeToTranslationKey } from "@/models/utils";
import { VideoTypeIsExtra } from "@/models/video";
import { generateArray } from "@/utils/gen-list";
import { useInfiniteQuery, useQuery } from "~/api";
import ExternalMetadataBadge from "~/components/external-metadata-badge";
import { useGradientBackground } from "~/components/gradient-background";
import { Head } from "~/components/head";
import {
	AlbumListPageSection,
	SectionPadding,
	SongGridPageSection,
	VideoListPageSection,
} from "~/components/page-section";
import ArtistRelationPageHeader from "~/components/relation-page-header/resource/artist";
import ResourceDescription from "~/components/resource-description";
import SectionHeader from "~/components/section-header";
import getSlugOrId from "~/utils/getSlugOrId";

// Number of Song item in the 'Top Song' section
const SongListSize = 6;
// Number of Album item in the 'Latest albums' section
const AlbumListSize = 10;
const VideoListSize = 10;

const latestAlbumsQuery = AlbumType.map((type) => ({
	type: type,
	query: (artistSlugOrId: string | number) => {
		return getAlbums(
			{ artist: artistSlugOrId, type: [type] },
			{ sortBy: "releaseDate", order: "desc" },
			["illustration"],
		);
	},
}));

const videosQuery = (artistSlugOrId: string | number) =>
	getVideos(
		{ artist: artistSlugOrId },
		{ sortBy: "addDate", order: "desc" },
		["artist", "master", "illustration"],
	);

const topSongsQuery = (artistSlugOrId: string | number) =>
	getSongs(
		{ artist: artistSlugOrId },
		{ sortBy: "totalPlayCount", order: "desc" },
		["artist", "featuring", "master", "illustration"],
	);

const rareSongsQuery = (artistSlugOrId: string | number) =>
	getSongs(
		{ rare: artistSlugOrId },
		{ sortBy: "releaseDate", order: "desc" },
		["artist", "featuring", "master", "illustration"],
	);

const artistQuery = (artistSlugOrId: string | number) =>
	getArtist(artistSlugOrId, ["illustration"]);

const externalMetadataQuery = (artistSlugOrId: string | number) =>
	getArtistExternalMetadata(artistSlugOrId);
const appearanceQuery = (artistSlugOrId: string | number) =>
	getAlbums(
		{ appearance: artistSlugOrId },
		{ sortBy: "releaseDate", order: "desc" },
		["artist", "illustration"],
	);

const prepareSSR = (context: NextPageContext) => {
	const artistIdentifier = getSlugOrId(context.query);

	return {
		additionalProps: { artistIdentifier },
		queries: [
			artistQuery(artistIdentifier),
			externalMetadataQuery(artistIdentifier),
		],
		infiniteQueries: [
			rareSongsQuery(artistIdentifier),
			videosQuery(artistIdentifier),
			topSongsQuery(artistIdentifier),
			appearanceQuery(artistIdentifier),
			...latestAlbumsQuery.map(({ query }) => query(artistIdentifier)),
		],
	};
};

const ArtistPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const { t } = useTranslation();
	const router = useRouter();
	const artistIdentifier =
		props?.artistIdentifier ?? getSlugOrId(router.query);
	const artist = useQuery(artistQuery, artistIdentifier);
	const albums = latestAlbumsQuery.map(({ type, query }) => ({
		type: type,

		query: useInfiniteQuery(query, artistIdentifier),
	}));
	const videos = useInfiniteQuery(videosQuery, artistIdentifier);
	const topSongs = useInfiniteQuery(topSongsQuery, artistIdentifier);
	const rareSongs = useInfiniteQuery(rareSongsQuery, artistIdentifier);
	const appearances = useInfiniteQuery(appearanceQuery, artistIdentifier);
	const externalMetadata = useQuery(externalMetadataQuery, artistIdentifier);
	const { musicVideos, liveVideos, extras } = useMemo(() => {
		return {
			musicVideos:
				videos.items?.filter(
					(video) =>
						!VideoTypeIsExtra(video.type) && video.type !== "Live",
				) ?? [],
			liveVideos:
				videos.items?.filter((video) => video.type === "Live") ?? [],
			extras:
				videos.items?.filter((video) => VideoTypeIsExtra(video.type)) ??
				[],
		};
	}, [videos]);
	const { GradientBackground } = useGradientBackground(
		artist.data?.illustration?.colors,
	);

	return (
		<Box sx={{ width: "100%" }}>
			<Head
				title={artist.data?.name}
				description={externalMetadata.data?.description ?? undefined}
			/>
			<GradientBackground />
			<ArtistRelationPageHeader artist={artist.data} />
			<Stack
				spacing={SectionPadding}
				sx={{
					padding: 2,
					flex: 1,
					flexGrow: 1,
					paddingTop: 4,
				}}
			>
				<SongGridPageSection
					title={"artist.topSongs"}
					artist={artist}
					maxItemCount={SongListSize}
					seeMoreHref={`/artists/${artistIdentifier}/songs`}
					query={topSongs}
				/>
				{albums
					.map(({ type, query }) => ({
						type,
						query,
						queryData: query.items,
					}))
					.filter(
						({ queryData }) =>
							queryData === undefined || queryData.length > 0,
					)
					.map(({ type, query }) => (
						<Fragment key={`section-${type}`}>
							<AlbumListPageSection
								subtitleIs="releaseYear"
								title={albumTypeToTranslationKey(type, true)}
								maxItemCount={AlbumListSize}
								artist={artist}
								seeMoreHref={`/artists/${artistIdentifier}/albums?type=${type}&sort=releaseDate&order=desc`}
								minimizePadding
								query={query}
							/>
						</Fragment>
					))}
				<SongGridPageSection
					title={"artist.rareSongs"}
					artist={artist}
					maxItemCount={SongListSize}
					seeMoreHref={`/artists/${artistIdentifier}/rare-songs`}
					query={rareSongs}
				/>
				{[
					{ label: "musicVideos", items: musicVideos } as const,
					{ label: "livePerformances", items: liveVideos } as const,
					{ label: "extras", items: extras } as const,
				].map(
					({ label, items }) =>
						items.length !== 0 && (
							<Fragment key={`videos-${label}`}>
								<VideoListPageSection
									title={`browsing.sections.${label}`}
									artist={artist}
									maxItemCount={VideoListSize}
									seeMoreHref={`/artists/${artistIdentifier}/videos`}
									items={items}
									subtitle="duration"
								/>
							</Fragment>
						),
				)}
				<AlbumListPageSection
					title={"artist.appearsOn"}
					artist={artist}
					maxItemCount={AlbumListSize}
					subtitleIs="artistName"
					query={appearances}
				/>
				{externalMetadata.data?.description && (
					<Box>
						<Divider sx={{ marginBottom: 3 }} />
						<SectionHeader heading={t("browsing.sections.about")} />
						<Container
							maxWidth={false}
							sx={{ paddingY: 4, paddingTop: 3 }}
						>
							<ResourceDescription
								externalMetadata={externalMetadata.data}
							/>
						</Container>
					</Box>
				)}
				{(externalMetadata.data === undefined ||
					externalMetadata.data?.sources.length) && (
					<>
						<Divider />
						<Grid
							container
							spacing={1}
							sx={{ alignItems: "center" }}
						>
							<Grid sx={{ paddingRight: 3 }}>
								<SectionHeader
									heading={t("models.externalLink_plural")}
								/>
							</Grid>
							{(
								externalMetadata.data?.sources.filter(
									({ url }) => url !== null,
								) ?? generateArray(2)
							).map((externalSource, index) => (
								<Grid key={index}>
									<ExternalMetadataBadge
										source={externalSource}
									/>
								</Grid>
							)) ?? []}
						</Grid>
					</>
				)}
			</Stack>
		</Box>
	);
};

ArtistPage.prepareSSR = prepareSSR;

export default ArtistPage;
