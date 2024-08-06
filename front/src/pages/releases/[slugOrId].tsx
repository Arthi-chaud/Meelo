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

import {
	Button,
	Container,
	Divider,
	Grid,
	IconButton,
	ListSubheader,
	Rating,
	Skeleton,
	Typography,
	useTheme,
} from "@mui/material";
import { Box } from "@mui/system";
import { useRouter } from "next/router";
import API from "../../api/api";
import Illustration from "../../components/illustration";
import formatDuration from "../../utils/formatDuration";
import { useMemo } from "react";
import Link from "next/link";
import { PlayIcon, ShuffleIcon } from "../../components/icons";
import {
	prepareMeeloQuery,
	useInfiniteQuery,
	useQuery,
} from "../../api/use-query";
import { shuffle } from "d3-array";
import getSlugOrId from "../../utils/getSlugOrId";
import ReleaseTrackList from "../../components/release-tracklist";
import { GetPropsTypesFrom, Page } from "../../ssr";
import ReleaseContextualMenu from "../../components/contextual-menu/release-contextual-menu";
import TileRow from "../../components/tile-row";
import VideoTile from "../../components/tile/video-tile";
import ExternalIdBadge from "../../components/external-id-badge";
import ArtistTile from "../../components/tile/artist-tile";
import PlaylistTile from "../../components/tile/playlist-tile";
import ReleaseTile from "../../components/tile/release-tile";
import SongGrid from "../../components/song-grid";
import AlbumTile from "../../components/tile/album-tile";
import getYear from "../../utils/getYear";
import Fade from "../../components/fade";
import ResourceDescriptionExpandable from "../../components/resource-description-expandable";
import { Star1 } from "iconsax-react";
import GenreButton from "../../components/genre-button";
import { SongWithRelations } from "../../models/song";
import Video from "../../models/video";
import { useAccentColor } from "../../utils/accent-color";
import { useTranslation } from "react-i18next";
import { generateArray } from "../../utils/gen-list";
import { usePlayerContext } from "../../contexts/player";
import { NextPageContext } from "next";
import { QueryClient } from "react-query";
import { useGradientBackground } from "../../utils/gradient-background";
import Tracklist, { TracklistItemWithRelations } from "../../models/tracklist";
import { Head } from "../../components/head";

const releaseQuery = (releaseIdentifier: string | number) =>
	API.getRelease(releaseIdentifier, ["album", "externalIds", "illustration"]);
const releaseTracklistQuery = (releaseIdentifier: number | string) => {
	const query = API.getReleaseTracklist(releaseIdentifier, [
		"artist",
		"featuring",
	]);
	return {
		key: query.key,
		exec: () =>
			query.exec({ pageSize: 10000 }).then(({ items }) => {
				return items.reduce(
					(prev, item) => {
						const itemKey = item.discIndex ?? "?";
						return {
							...prev,
							[item.discIndex ?? "?"]: [
								...(prev[itemKey] ?? []),
								item,
							],
						};
					},
					{} as Tracklist<
						TracklistItemWithRelations<"artist" | "featuring">
					>,
				);
			}),
	};
};
const albumQuery = (albumId: number) =>
	API.getAlbum(albumId, ["externalIds", "genres", "artist"]);
const artistsOnAlbumQuery = (albumId: number) => {
	const query = API.getArtists({ album: albumId }, undefined, [
		"illustration",
	]);

	return {
		key: query.key,
		exec: () => query.exec({ pageSize: 10000 }).then((res) => res.items),
	};
};

const albumGenreQuery = (albumId: number) => API.getGenres({ album: albumId });
const releaseBSidesQuery = (releaseId: number) =>
	API.getSongs({ bsides: releaseId }, { sortBy: "name" }, [
		"artist",
		"featuring",
		"master",
		"illustration",
	]);
const albumVideosQuery = (albumId: number) => API.getVideos({ album: albumId });
const relatedAlbumsQuery = (albumId: number) =>
	API.getAlbums({ related: albumId }, { sortBy: "releaseDate" }, [
		"artist",
		"illustration",
	]);
const relatedReleasesQuery = (albumId: number) =>
	API.getReleases({ album: albumId }, { sortBy: "releaseDate" }, [
		"illustration",
	]);
const relatedPlaylistsQuery = (albumId: number) =>
	API.getPlaylists({ album: albumId }, undefined, ["illustration"]);

const prepareSSR = async (
	context: NextPageContext,
	queryClient: QueryClient,
) => {
	const releaseIdentifier = getSlugOrId(context.query);
	const release = await queryClient.fetchQuery(
		prepareMeeloQuery(() => releaseQuery(releaseIdentifier)),
	);

	return {
		additionalProps: { releaseIdentifier },
		queries: [
			releaseTracklistQuery(releaseIdentifier),
			albumQuery(release.albumId),
			artistsOnAlbumQuery(release.albumId),
		],
		infiniteQueries: [
			albumGenreQuery(release.albumId),
			releaseBSidesQuery(release.id),
			albumVideosQuery(release.albumId),
			relatedAlbumsQuery(release.albumId),
			relatedReleasesQuery(release.albumId),
			relatedPlaylistsQuery(release.albumId),
		],
	};
};

type RelatedContentSectionProps = {
	display: boolean;
	title: string | JSX.Element;
	children: JSX.Element[] | JSX.Element;
};

const RelatedContentSection = (props: RelatedContentSectionProps) => {
	return (
		<Fade in={props.display == true}>
			<Box
				sx={{ margin: 2, display: props.display ? undefined : "none" }}
			>
				<Divider />
				<Typography variant="h6" sx={{ paddingY: 3 }}>
					{props.title}
				</Typography>
				{props.children}
			</Box>
		</Fade>
	);
};

const ReleasePage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const router = useRouter();
	const { t } = useTranslation();
	const releaseIdentifier =
		props?.releaseIdentifier ?? getSlugOrId(router.query);
	const theme = useTheme();
	const { playTracks } = usePlayerContext();
	const release = useQuery(releaseQuery, releaseIdentifier);
	const artistId = useMemo(() => release.data?.album?.artistId, [release]);
	const album = useQuery(albumQuery, release.data?.albumId);
	const tracklistQuery = useQuery(releaseTracklistQuery, releaseIdentifier);
	const albumGenres = useInfiniteQuery(
		albumGenreQuery,
		release.data?.albumId,
	);
	const hasGenres = (albumGenres.data?.pages.at(0)?.items.length ?? 1) > 0;
	const artists = useQuery(artistsOnAlbumQuery, release.data?.albumId);
	const albumVideos = useInfiniteQuery(
		albumVideosQuery,
		release.data?.albumId,
	);
	const bSidesQuery = useInfiniteQuery(releaseBSidesQuery, release.data?.id);
	const relatedAlbums = useInfiniteQuery(
		relatedAlbumsQuery,
		release.data?.albumId,
	);
	const relatedReleases = useInfiniteQuery(
		relatedReleasesQuery,
		release.data?.albumId,
	);
	const relatedPlaylists = useInfiniteQuery(
		relatedPlaylistsQuery,
		release.data?.albumId,
	);
	const albumArtist = useMemo(() => album.data?.artist, [album.data]);
	const featurings = useMemo(
		() => artists.data?.filter((artist) => artist.id !== artistId),
		[artistId, artists],
	);
	const playlists = useMemo(
		() => relatedPlaylists.data?.pages.at(0)?.items,
		[relatedPlaylists.data],
	);
	const { bSides, extras } = useMemo(
		() =>
			(bSidesQuery.data?.pages.at(0)?.items ?? []).reduce(
				(prev, current) => {
					if (current.type === "NonMusic") {
						return {
							bSides: prev.bSides,
							extras: prev.extras.concat(current),
						};
					}
					return {
						bSides: prev.bSides.concat(current),
						extras: prev.extras,
					};
				},
				{ bSides: [], extras: [] } as Record<
					"bSides" | "extras",
					SongWithRelations<
						"artist" | "featuring" | "master" | "illustration"
					>[]
				>,
			),
		[bSidesQuery.data],
	);
	const { videos, videoExtras } = useMemo(
		() =>
			(albumVideos.data?.pages.at(0)?.items ?? []).reduce(
				(prev, current) => {
					if (current.type === "NonMusic") {
						return {
							videos: prev.videos,
							videoExtras: prev.videoExtras.concat(current),
						};
					}
					return {
						videos: prev.videos.concat(current),
						videoExtras: prev.videoExtras,
					};
				},
				{ videos: [], videoExtras: [] } as Record<
					"videos" | "videoExtras",
					Video[]
				>,
			),
		[albumVideos.data],
	);
	const [tracks, totalDuration, trackList] = useMemo(() => {
		if (tracklistQuery.data) {
			const discMap = tracklistQuery.data;
			const flatTracks = Array.from(Object.values(discMap)).flat();

			return [
				flatTracks,
				flatTracks.reduce(
					(prevDuration, track) =>
						prevDuration + (track.duration ?? 0),
					0,
				),
				discMap,
			];
		}
		return [[], undefined, undefined];
	}, [tracklistQuery.data]);
	const illustration = useMemo(
		() => release.data?.illustration,
		[release.data],
	);
	const externalIdWithDescription = useMemo(
		() =>
			album.data?.externalIds
				.filter(
					({ provider }) => provider.name.toLowerCase() !== "discogs",
				)
				.find(({ description }) => description !== null),
		[album.data],
	);
	const externalIds = useMemo(() => {
		if (album.data === undefined || release.data === undefined) {
			return undefined;
		}
		return [...album.data.externalIds, ...release.data.externalIds];
	}, [album.data, release.data]);

	const albumRating = useMemo(() => {
		return album.data
			? album.data.externalIds
					.map(({ rating }) => rating)
					.filter((rating) => rating !== null)
					.sort()
					.at(-1) ?? null
			: undefined;
	}, [album.data]);
	const accentColor = useAccentColor(illustration);
	const { GradientBackground } = useGradientBackground(illustration?.colors);

	return (
		<>
			<Head title={release.data?.name} />
			<GradientBackground />
			<Container
				maxWidth={false}
				sx={{
					marginTop: 3,
					marginX: 0,
					position: "relative",
					[theme.breakpoints.down("lg")]: {
						padding: 0,
					},
				}}
			>
				<Grid container spacing={4} sx={{ justifyContent: "center" }}>
					<Grid item xl={2} lg={3} sm={5} xs={8}>
						<Illustration
							illustration={illustration}
							quality="original"
						/>
					</Grid>
					<Grid
						item
						container
						sx={{
							width: "100%",
							display: "flex",
							flexDirection: "column",
							justifyContent: "space-evenly",
							alignItems: "left",
							[theme.breakpoints.down("sm")]: {
								alignItems: "center",
								textAlign: "center",
							},
						}}
						xs={12}
						sm={7}
						lg={6}
						xl
					>
						<Grid item sx={{ width: "inherit" }}>
							<Typography
								variant="h3"
								fontWeight="bold"
								sx={{
									overflow: "hidden",
									display: "-webkit-box",
									WebkitLineClamp: 3,
									lineClamp: 3,
									WebkitBoxOrient: "vertical",
								}}
							>
								{release.data?.name ?? (
									<>
										<Skeleton />
										<Skeleton />
									</>
								)}
							</Typography>
						</Grid>
						{albumArtist !== null && (
							<Grid item>
								<Link
									href={
										albumArtist
											? `/artists/${albumArtist.slug}`
											: {}
									}
								>
									<Button
										variant="text"
										sx={{
											textTransform: "none",
											position: "relative",
											left: { xs: 0, sm: -8 },
										}}
									>
										<Typography variant="h4">
											{albumArtist?.name ?? (
												<Skeleton width={"200px"} />
											)}
										</Typography>
									</Button>
								</Link>
							</Grid>
						)}
						<Grid
							item
							style={{
								alignItems: "center",
								display: "inline-flex",
							}}
						>
							<Typography sx={{ color: "text.disabled" }}>
								{release.data?.extensions.join(" - ") ?? <br />}
							</Typography>
						</Grid>
						<Grid
							item
							style={{
								alignItems: "center",
								display: "inline-flex",
							}}
						>
							<Typography
								sx={{ color: "text.disabled" }}
								component={"span"}
							>
								{(release.data?.releaseDate ||
									release.data?.album.releaseDate) &&
									`${new Date(
										release.data.releaseDate ??
											release.data.album.releaseDate!,
									).getFullYear()} - `}
								{totalDuration !== undefined ? (
									formatDuration(totalDuration)
								) : (
									<Skeleton width={"100px"} />
								)}
							</Typography>
							{albumRating && (
								<Rating
									sx={{
										paddingLeft: 1.5,
										color: accentColor?.light,
										[theme.getColorSchemeSelector("dark")]:
											{
												color: accentColor?.dark,
											},
									}}
									readOnly
									value={albumRating / 20}
									icon={
										<Star1
											size={18}
											style={{ marginTop: -3 }}
										/>
									}
									emptyIcon={
										<Star1
											size={18}
											style={{
												marginTop: -3,
												color: theme.vars.palette.text
													.disabled,
											}}
											opacity={0.2}
										/>
									}
								/>
							)}
						</Grid>
					</Grid>
					<Grid
						item
						container
						lg={3}
						xs={12}
						sx={{
							spacing: 5,
							alignItems: "center",
							justifyContent: "space-evenly",
							display: "flex",
						}}
					>
						{[PlayIcon, ShuffleIcon].map((Icon, index) => (
							<Grid item key={index}>
								<IconButton
									onClick={() => {
										if (
											tracks &&
											release.data &&
											artists.data !== undefined
										) {
											let playlist = tracks.map(
												(track) => ({
													track: track,
													artist: artists.data.find(
														(artist) =>
															artist.id ==
															track.song.artistId,
													)!,
													release: release.data,
												}),
											);

											if (index == 1) {
												playlist = shuffle(playlist);
											}
											playTracks({
												tracks: playlist,
											});
										}
									}}
								>
									{<Icon fontSize="large" />}
								</IconButton>
							</Grid>
						))}
						<Grid item>
							{release.data && (
								<ReleaseContextualMenu release={release.data} />
							)}
						</Grid>
					</Grid>
				</Grid>
				<Grid
					container
					spacing={1}
					sx={{ display: "flex", paddingY: 2 }}
				>
					{hasGenres && (
						<Grid item xl={2} lg={3} xs={12} marginTop={1}>
							<Fade in>
								<Box>
									<Grid
										container
										spacing={1}
										sx={{ alignItems: "center" }}
									>
										<Grid item>
											<ListSubheader
												sx={{
													backgroundColor:
														"transparent",
													lineHeight: "normal",
												}}
											>
												{`${t("genres")}: `}
											</ListSubheader>
										</Grid>
										{(
											albumGenres.data?.pages.at(0)
												?.items ?? generateArray(3)
										)
											.sort(
												(a, b) =>
													a.slug.length -
													b.slug.length,
											)
											.slice(0, 10)
											.map((genre, index) => (
												<Grid
													item
													key={index}
													sx={{ display: "flex" }}
												>
													<GenreButton
														genre={genre}
														sx={{
															borderColor:
																accentColor?.light,
															[theme.getColorSchemeSelector(
																"dark",
															)]: {
																borderColor:
																	accentColor?.dark,
															},
														}}
													/>
												</Grid>
											)) ?? []}
									</Grid>
									<Divider
										sx={{
											paddingY: 1,
											display: "none",
											[theme.breakpoints.down("lg")]: {
												display: "block",
											},
										}}
									/>
								</Box>
							</Fade>
						</Grid>
					)}
					<Grid item xl lg={hasGenres ? 9 : true} xs={12}>
						<ReleaseTrackList
							mainArtist={albumArtist}
							tracklist={
								trackList && album.data // need to wait for main artist
									? Object.fromEntries(
											Array.from(
												Object.entries(trackList),
											).map(([discKey, discTracks]) => [
												discKey,
												discTracks.map((discTrack) => ({
													...discTrack,
													song: discTrack.song,
												})),
											]),
										)
									: undefined
							}
							release={release.data}
						/>
					</Grid>
				</Grid>
				<RelatedContentSection
					display={(bSides.length ?? 0) > 0}
					title={t("bonusTracks")}
				>
					<SongGrid
						parentArtistName={albumArtist?.name}
						songs={bSides ?? []}
					/>
				</RelatedContentSection>
				<RelatedContentSection
					display={
						(relatedReleases.data?.pages.at(0)?.items?.length ??
							0) > 1
					}
					title={t("otherAlbumReleases")}
				>
					<TileRow
						tiles={
							relatedReleases.data?.pages
								.at(0)
								?.items?.filter(
									(relatedRelease) =>
										relatedRelease.id != release.data!.id,
								)
								.map((otherRelease, otherReleaseIndex) => (
									<ReleaseTile
										key={otherReleaseIndex}
										release={
											album.data
												? {
														...otherRelease,
														album: album.data,
													}
												: undefined
										}
									/>
								)) ?? []
						}
					/>
				</RelatedContentSection>
				<RelatedContentSection
					display={videos !== undefined && videos.length != 0}
					title={t("musicVideos")}
				>
					<TileRow
						tiles={
							videos?.map((video, videoIndex) => (
								<VideoTile key={videoIndex} video={video} />
							)) ?? []
						}
					/>
				</RelatedContentSection>
				<RelatedContentSection
					display={extras.length > 0 || videoExtras.length > 0}
					title={t("extras")}
				>
					{extras.length > 0 ? (
						<SongGrid
							parentArtistName={albumArtist?.name}
							songs={extras}
						/>
					) : (
						<></>
					)}
					{videoExtras.length > 0 ? (
						<TileRow
							tiles={videoExtras.map((video, videoIndex) => (
								<VideoTile key={videoIndex} video={video} />
							))}
						/>
					) : (
						<></>
					)}
				</RelatedContentSection>
				<RelatedContentSection
					display={
						(relatedAlbums.data?.pages.at(0)?.items?.length ?? 0) >
						0
					}
					title={t("relatedAlbums")}
				>
					<TileRow
						tiles={
							relatedAlbums.data?.pages
								.at(0)
								?.items?.map((otherAlbum, otherAlbumIndex) => (
									<AlbumTile
										key={otherAlbumIndex}
										album={otherAlbum}
										formatSubtitle={(albumItem) =>
											getYear(
												albumItem.releaseDate,
											)?.toString() ?? ""
										}
									/>
								)) ?? []
						}
					/>
				</RelatedContentSection>
				<RelatedContentSection
					display={(featurings?.length ?? 0) != 0}
					title={t("onThisAlbum")}
				>
					<TileRow
						tiles={
							featurings?.map((artist) => (
								<ArtistTile key={artist.id} artist={artist} />
							)) ?? []
						}
					/>
				</RelatedContentSection>
				<RelatedContentSection
					display={(playlists?.length ?? 0) != 0}
					title={t("featuredOnPlaylists")}
				>
					<TileRow
						tiles={
							playlists?.map((playlist) => (
								<PlaylistTile
									key={playlist.id}
									playlist={playlist}
								/>
							)) ?? []
						}
					/>
				</RelatedContentSection>
				{externalIdWithDescription && (
					<RelatedContentSection display title={t("about")}>
						<Box sx={{ paddingBottom: 2 }}>
							<ResourceDescriptionExpandable
								externalDescription={externalIdWithDescription}
							/>
						</Box>
					</RelatedContentSection>
				)}
				<RelatedContentSection
					display={
						externalIds === undefined || externalIds.length > 0
					}
					title={t("externalLinks")}
				>
					<Grid container spacing={1}>
						{(
							externalIds?.filter(({ url }) => url !== null) ??
							generateArray(2)
						).map((externalId, index) => (
							<Grid item key={index}>
								<ExternalIdBadge externalId={externalId} />
							</Grid>
						))}
					</Grid>
				</RelatedContentSection>
			</Container>
		</>
	);
};

ReleasePage.prepareSSR = prepareSSR;

export default ReleasePage;
