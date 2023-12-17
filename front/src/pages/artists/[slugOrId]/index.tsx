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
import {
	MeeloQueryFn,
	useInfiniteQuery,
	useQueries,
	useQuery,
} from "../../../api/use-query";
import AlbumTile from "../../../components/tile/album-tile";
import Link from "next/link";
import getSlugOrId from "../../../utils/getSlugOrId";
import prepareSSR, { InferSSRProps } from "../../../ssr";
import LoadingPage from "../../../components/loading/loading-page";
import TileRow from "../../../components/tile-row";
import getYear from "../../../utils/getYear";
import SectionHeader from "../../../components/section-header";
import VideoTile from "../../../components/tile/video-tile";
import formatDuration from "../../../utils/formatDuration";
import ExternalIdBadge from "../../../components/external-id-badge";
import SongGrid from "../../../components/song-grid";
import Translate from "../../../i18n/translate";
import { MoreIcon } from "../../../components/icons";
import BackgroundBlurhash from "../../../components/blurhash-background";
import ResourceDescriptionExpandable from "../../../components/resource-description-expandable";
import ArtistRelationPageHeader from "../../../components/relation-page-header/artist-relation-page-header";
import Album, { AlbumType } from "../../../models/album";

// Number of Song item in the 'Top Song' section
const songListSize = 6;
// Number of Album item in the 'Latest albums' section
const albumListSize = 10;

type AlbumsWithType = {
	type: AlbumType;
	items: Album[];
};

const latestAlbumsQuery = AlbumType.map(
	(type) => (artistSlugOrId: string | number) => {
		const query = API.getAlbums(
			{ artist: artistSlugOrId, type: type },
			{ sortBy: "releaseDate", order: "desc" },
		);
		return {
			key: query.key,
			exec: () =>
				query.exec({}).then((res) => ({ type, items: res.items })),
		};
	},
);

const videosQuery = (artistSlugOrId: string | number) =>
	API.getVideos(
		{ artist: artistSlugOrId },
		{ sortBy: "playCount", order: "desc" },
	);

const topSongsQuery = (artistSlugOrId: string | number) =>
	API.getSongs(
		{ artist: artistSlugOrId },
		{ sortBy: "playCount", order: "desc" },
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

export const getServerSideProps = prepareSSR((context) => {
	const artistIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { artistIdentifier },
		queries: [
			artistQuery(artistIdentifier),
			...latestAlbumsQuery.map((q) => q(artistIdentifier)),
		],
		infiniteQueries: [
			videosQuery(artistIdentifier),
			topSongsQuery(artistIdentifier),
			appearanceQuery(artistIdentifier),
		],
	};
});

const ArtistPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();
	const artistIdentifier =
		props.additionalProps?.artistIdentifier ?? getSlugOrId(router.query);
	const artist = useQuery(artistQuery, artistIdentifier);
	const albums = useQueries(
		...latestAlbumsQuery.map(
			(q): [MeeloQueryFn<AlbumsWithType>, string] => [
				q,
				artistIdentifier,
			],
		),
	);
	const videos = useInfiniteQuery(videosQuery, artistIdentifier);
	const topSongs = useInfiniteQuery(topSongsQuery, artistIdentifier);
	const appearances = useInfiniteQuery(appearanceQuery, artistIdentifier);
	const externalIdWithDescription = artist.data?.externalIds.find(
		({ description }) => description !== null,
	);

	if (
		!artist.data ||
		albums.find((q) => !q.data) ||
		!topSongs.data ||
		!videos.data
	) {
		return <LoadingPage />;
	}
	return (
		<Box sx={{ width: "100%" }}>
			<BackgroundBlurhash blurhash={artist.data.illustration?.blurhash} />
			<ArtistRelationPageHeader artist={artist.data} />
			<Grid
				container
				direction="column"
				spacing={4}
				sx={{ padding: 2, flex: 1, flexGrow: 1 }}
			>
				{topSongs.data?.pages.at(0)?.items.length != 0 && (
					<>
						<SectionHeader
							heading={<Translate translationKey="topSongs" />}
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
											<Translate translationKey="seeAll" />
										</Button>
									</Link>
								) : undefined
							}
						/>
						<Grid
							item
							container
							sx={{ display: "block", flexGrow: 1 }}
						>
							<SongGrid
								parentArtistName={artist.data.name}
								songs={
									topSongs.data.pages
										.at(0)
										?.items.slice(0, songListSize) ?? []
								}
							/>
						</Grid>
					</>
				)}
				{albums
					.map(({ data }) => data)
					.filter((data): data is AlbumsWithType => data != undefined)
					.filter((data) => data.items.length > 0)
					.map(({ type, items }) => (
						<>
							<SectionHeader
								heading={<Translate translationKey={type} />}
								trailing={
									items.length > albumListSize ? (
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
												<Translate translationKey="seeAll" />
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
											.map((album) => (
												<AlbumTile
													key={album.id}
													album={{
														...album,
														artist: artist.data,
													}}
													formatSubtitle={(
														albumItem,
													) =>
														getYear(
															albumItem.releaseDate,
														)?.toString() ?? ""
													}
												/>
											)) ?? []
									}
								/>
							</Grid>
						</>
					))}
				{videos.data.pages.at(0)?.items.length != 0 && (
					<>
						<SectionHeader
							heading={<Translate translationKey="topVideos" />}
							trailing={
								(videos.data.pages.at(0)?.items.length ?? 0) >
								albumListSize ? (
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
											<Translate translationKey="seeAll" />
										</Button>
									</Link>
								) : undefined
							}
						/>
						<Grid item sx={{ overflowX: "clip", width: "100%" }}>
							<TileRow
								tiles={
									videos.data.pages
										.at(0)
										?.items.slice(0, albumListSize)
										.map(({ track, ...song }) => (
											<VideoTile
												key={track.id}
												video={{ ...track, song }}
												formatSubtitle={(item) =>
													formatDuration(
														item.duration,
													).toString()
												}
											/>
										)) ?? []
								}
							/>
						</Grid>
					</>
				)}
				{(appearances.data?.pages?.at(0)?.items.length ?? 0) != 0 && (
					<>
						<Divider sx={{ paddingTop: 4 }} />
						<SectionHeader
							heading={<Translate translationKey="appearsOn" />}
						/>
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
						<Divider sx={{ paddingTop: 3 }} />
						<SectionHeader
							heading={<Translate translationKey="about" />}
						/>
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
				{artist.data.externalIds.length != 0 && (
					<>
						<Divider />
						<Grid
							container
							item
							spacing={1}
							sx={{ alignItems: "center" }}
						>
							<Grid item sx={{ paddingRight: 3 }}>
								<SectionHeader
									heading={
										<Translate translationKey="externalLinks" />
									}
								/>
							</Grid>
							{artist.data.externalIds
								.filter(({ url }) => url !== null)
								.map((externalId) => (
									<Grid item key={externalId.provider.name}>
										<ExternalIdBadge
											externalId={externalId}
										/>
									</Grid>
								)) ?? []}
						</Grid>
					</>
				)}
			</Grid>
		</Box>
	);
};

export default ArtistPage;
