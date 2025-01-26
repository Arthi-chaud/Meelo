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
	ListItemButton,
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
import { useEffect, useMemo, useState } from "react";
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
import type { GetPropsTypesFrom, Page } from "../../ssr";
import ReleaseContextualMenu from "../../components/contextual-menu/release-contextual-menu";
import TileRow from "../../components/tile-row";
import VideoTile from "../../components/tile/video-tile";
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
import type { SongWithRelations } from "../../models/song";
import { VideoTypeIsExtra, type VideoWithRelations } from "../../models/video";
import { useAccentColor } from "../../utils/accent-color";
import { useTranslation } from "react-i18next";
import { generateArray } from "../../utils/gen-list";
import { usePlayerContext } from "../../contexts/player";
import type { NextPageContext } from "next";
import type { QueryClient } from "react-query";
import { useGradientBackground } from "../../utils/gradient-background";
import type Tracklist from "../../models/tracklist";
import type { TracklistItemWithRelations } from "../../models/tracklist";
import { Head } from "../../components/head";
import { useThemedSxValue } from "../../utils/themed-sx-value";
import { parentScrollableDivId } from "../../components/infinite/infinite-scroll";
import ExternalMetadataBadge from "../../components/external-metadata-badge";

const releaseQuery = (releaseIdentifier: string | number) =>
	API.getRelease(releaseIdentifier, ["album", "illustration"]);
const releaseTracklistQuery = (
	releaseIdentifier: number | string,
	exclusiveOnly: boolean,
) => {
	const query = API.getReleaseTracklist(releaseIdentifier, exclusiveOnly, [
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
	API.getAlbum(albumId, ["genres", "artist"]);
const externalMetadataQuery = (albumIdentifier: string | number) =>
	API.getAlbumExternalMetadata(albumIdentifier);
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
const albumVideosQuery = (albumId: number) =>
	API.getVideos({ album: albumId }, undefined, ["master", "illustration"]);
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
			releaseTracklistQuery(releaseIdentifier, false),
			albumQuery(release.albumId),
			artistsOnAlbumQuery(release.albumId),
			externalMetadataQuery(release.albumId),
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
		<Fade in={props.display === true}>
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
	const [showOnlyExclusive, setShowOnlyExclusive] = useState(false);
	const releaseIdentifier =
		props?.releaseIdentifier ?? getSlugOrId(router.query);
	const theme = useTheme();
	const { playTracks } = usePlayerContext();
	const release = useQuery(releaseQuery, releaseIdentifier);
	const externalMetadata = useQuery(
		externalMetadataQuery,
		release.data?.albumId,
	);
	const artistId = useMemo(() => release.data?.album?.artistId, [release]);
	const album = useQuery(albumQuery, release.data?.albumId);
	const tracklistQuery = useQuery(
		(rId) => releaseTracklistQuery(rId, showOnlyExclusive),
		releaseIdentifier,
	);
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
					if (["NonMusic", "Medley"].includes(current.type)) {
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
	const { videos, liveVideos, videoExtras } = useMemo(
		() =>
			(albumVideos.data?.pages.at(0)?.items ?? [])
				.map((video) => {
					const videoIndex = tracks.findIndex(
						(track) =>
							(track.song ?? track.video)!.groupId ===
							video.groupId,
					);
					return [
						video,
						videoIndex === -1 ? tracks.length : videoIndex,
					] as const;
				})

				.sort(
					([v1, i1], [v2, i2]) =>
						i1 - i2 || v1.slug.localeCompare(v2.slug),
				)
				.map(([video, tracklistIndex], _, videosWithIndexes) => {
					if (album.data?.type === "Single") {
						return [video, tracklistIndex] as const;
					}
					const firstVideoOfSameGroup = videosWithIndexes.find(
						([__, i]) => i === tracklistIndex,
					)!;
					return [
						video,
						firstVideoOfSameGroup[0].id === video.id
							? tracklistIndex
							: 10000 + tracklistIndex,
					] as const;
				})
				.sort(([_, i1], [__, i2]) => i1 - i2)
				.map(([v, _]) => v)
				.reduce(
					(prev, current) => {
						if (VideoTypeIsExtra(current.type)) {
							return {
								videos: prev.videos,
								liveVideos: prev.liveVideos,
								videoExtras: prev.videoExtras.concat(current),
							};
						}
						if (current.type === "Live") {
							return {
								videos: prev.videos,
								liveVideos: prev.liveVideos.concat(current),
								videoExtras: prev.videoExtras,
							};
						}
						return {
							videos: prev.videos.concat(current),
							liveVideos: prev.liveVideos,
							videoExtras: prev.videoExtras,
						};
					},
					{
						videos: [],
						videoExtras: [],
						liveVideos: [],
					} as Record<
						"videos" | "videoExtras" | "liveVideos",
						VideoWithRelations<"master" | "illustration">[]
					>,
				),
		[albumVideos.data, tracks],
	);
	const illustration = useMemo(
		() => release.data?.illustration,
		[release.data],
	);
	const accentColor = useAccentColor(illustration);
	const { GradientBackground } = useGradientBackground(illustration?.colors);
	const ratingColor = useThemedSxValue(
		"color",
		accentColor?.light,
		accentColor?.dark,
	);
	const genreButtonOutline = useThemedSxValue(
		"borderColor",
		accentColor?.light,
		accentColor?.dark,
	);
	useEffect(() => {
		//for some unknown reason, this state is persisted between release pages?!
		setShowOnlyExclusive(false);
	}, [router.asPath]);

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
							{externalMetadata.data?.rating && (
								<Rating
									sx={{
										paddingLeft: 1.5,
										...ratingColor,
									}}
									readOnly
									value={externalMetadata.data.rating / 20}
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
															artist.id ===
															(track.song ??
																track.video)!
																.artistId,
													)!,
													release: release.data,
												}),
											);

											if (index === 1) {
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
														sx={genreButtonOutline}
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
					<Grid
						item
						xl
						lg={hasGenres ? 9 : true}
						xs={12}
						id={"release-tracklist"}
					>
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
													song: discTrack.song!,
													video: discTrack.video!,
												})),
											]),
										)
									: undefined
							}
							release={release.data}
						/>
						{release.data?.album.type === "Compilation" &&
							/* It does not make sense to show the button if the album is from 'Various Artists' */
							albumArtist !== null && (
								<ListItemButton
									sx={{
										textAlign: "center",
										justifyContent: "center",
										width: "100%",
										fontWeight: "bolder",
									}}
									onClick={() => {
										setShowOnlyExclusive((v) => !v);
										document
											.getElementById(
												parentScrollableDivId,
											)
											?.scrollTo({
												top: 0,
												behavior: "smooth",
											});
									}}
								>
									{t(
										showOnlyExclusive
											? "showAllTrack"
											: "showOnlyExclusiveTracks",
									)}
								</ListItemButton>
							)}
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
										relatedRelease.id !== release.data!.id,
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
				{[
					[videos, "musicVideos"] as const,
					[liveVideos, "livePerformances"] as const,
				].map(([videoList, sectionLabel]) => (
					<RelatedContentSection
						key={`videos-${sectionLabel}`}
						display={
							videoList !== undefined && videoList.length !== 0
						}
						title={t(sectionLabel)}
					>
						<TileRow
							tiles={
								videoList?.map((video, videoIndex) => (
									<VideoTile
										key={videoIndex}
										video={video}
										subtitle="duration"
									/>
								)) ?? []
							}
						/>
					</RelatedContentSection>
				))}
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
								<VideoTile
									key={videoIndex}
									video={video}
									subtitle="duration"
								/>
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
					display={
						featurings !== undefined && featurings.length !== 0
					}
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
					display={playlists !== undefined && playlists.length !== 0}
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
				{externalMetadata.data?.description && (
					<RelatedContentSection display title={t("about")}>
						<Box sx={{ paddingBottom: 2 }}>
							<ResourceDescriptionExpandable
								externalMetadata={externalMetadata.data}
							/>
						</Box>
					</RelatedContentSection>
				)}
				<RelatedContentSection
					display={
						externalMetadata.data === undefined ||
						(externalMetadata.data?.sources.length ?? 0) > 0
					}
					title={t("externalLinks")}
				>
					<Grid container spacing={1}>
						{(
							externalMetadata.data?.sources.filter(
								({ url }) => url !== null,
							) ?? generateArray(2)
						).map((externalSource, index) => (
							<Grid item key={index}>
								<ExternalMetadataBadge
									source={externalSource}
								/>
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
