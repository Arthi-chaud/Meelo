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

import type API from "@/api";
import { getAPI, useInfiniteQuery, useQuery } from "@/api/hook";
import {
	getAlbum,
	getAlbumExternalMetadata,
	getAlbums,
	getArtists,
	getGenres,
	getPlaylists,
	getRelease,
	getReleaseTracklist,
	getReleases,
	getSongs,
	getVideos,
} from "@/api/queries";
import { toTanStackQuery } from "@/api/query";
import ReleaseContextualMenu from "@/components/contextual-menu/resource/release";
import Fade from "@/components/fade";
import { PlayIcon, ShuffleIcon } from "@/components/icons";
import Illustration from "@/components/illustration";
import AlbumTile from "@/components/tile/resource/album";
import ArtistTile from "@/components/tile/resource/artist";
import PlaylistTile from "@/components/tile/resource/playlist";
import ReleaseTile from "@/components/tile/resource/release";
import VideoTile from "@/components/tile/resource/video";
import TileRow from "@/components/tile/row";
import type { SongWithRelations } from "@/models/song";
import type Tracklist from "@/models/tracklist";
import type { TracklistItemWithRelations } from "@/models/tracklist";
import { VideoTypeIsExtra, type VideoWithRelations } from "@/models/video";
import { playTracksAtom } from "@/state/player";
import { getDate, getYear } from "@/utils/date";
import formatDuration from "@/utils/format-duration";
import { generateArray } from "@/utils/gen-list";
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
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import { Box } from "@mui/system";
import { shuffle } from "d3-array";
import { Star1 } from "iconsax-react";
import { useSetAtom } from "jotai";
import type { NextPageContext } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { QueryClient } from "react-query";
import type { GetPropsTypesFrom, Page } from "ssr";
import ExternalMetadataBadge from "~/components/external-metadata-badge";
import GenreButton from "~/components/genre-button";
import { useGradientBackground } from "~/components/gradient-background";
import { Head } from "~/components/head";
import { parentScrollableDivId } from "~/components/infinite/scroll";
import ReleaseTrackList from "~/components/release-tracklist";
import ResourceDescription from "~/components/resource-description";
import SongGrid from "~/components/song-grid";
import { useAccentColor } from "~/utils/accent-color";
import getSlugOrId from "~/utils/getSlugOrId";
import { useThemedSxValue } from "~/utils/themed-sx-value";

const formatReleaseDate = (date: Date, lang: string) => {
	if (date.getDate() === 1 && date.getMonth() === 0) {
		return date.getFullYear();
	}
	const res = Intl.DateTimeFormat(lang, {
		month: "short",
		year: "numeric",
		localeMatcher: "best fit",
	}).format(date);

	return res[0].toUpperCase() + res.slice(1);
};

const releaseQuery = (releaseIdentifier: string | number) =>
	getRelease(releaseIdentifier, ["album", "illustration", "discs", "label"]);
const releaseTracklistQuery = (
	releaseIdentifier: number | string,
	exclusiveOnly: boolean,
) => {
	const query = getReleaseTracklist(releaseIdentifier, exclusiveOnly, [
		"artist",
		"featuring",
	]);
	return {
		key: query.key,
		exec: (api: API) => () =>
			query
				.exec(api)({ pageSize: 10000 })
				.then(({ items }) => {
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
const albumQuery = (albumId: number) => getAlbum(albumId, ["genres", "artist"]);
const externalMetadataQuery = (albumIdentifier: string | number) =>
	getAlbumExternalMetadata(albumIdentifier);
const artistsOnAlbumQuery = (albumId: number) => {
	const query = getArtists({ album: albumId }, undefined, ["illustration"]);

	return {
		key: query.key,
		exec: (api: API) => () =>
			query
				.exec(api)({ pageSize: 10000 })
				.then((res) => res.items),
	};
};

const albumGenreQuery = (albumId: number) => getGenres({ album: albumId });
const releaseBSidesQuery = (releaseId: number) =>
	getSongs({ bsides: releaseId }, { sortBy: "name" }, [
		"artist",
		"featuring",
		"master",
		"illustration",
	]);
const albumVideosQuery = (albumId: number) =>
	getVideos({ album: albumId }, undefined, ["master", "illustration"]);
const relatedAlbumsQuery = (albumId: number) =>
	getAlbums({ related: albumId }, { sortBy: "releaseDate" }, [
		"artist",
		"illustration",
	]);
const relatedReleasesQuery = (albumId: number) =>
	getReleases({ album: albumId }, { sortBy: "releaseDate" }, [
		"illustration",
	]);
const relatedPlaylistsQuery = (albumId: number) =>
	getPlaylists({ album: albumId }, undefined, ["illustration"]);

const prepareSSR = async (
	context: NextPageContext,
	queryClient: QueryClient,
) => {
	const releaseIdentifier = getSlugOrId(context.query);
	const api = getAPI();
	const release = await queryClient.fetchQuery(
		toTanStackQuery(api, () => releaseQuery(releaseIdentifier)),
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
	const { t, i18n } = useTranslation();
	const [showOnlyExclusive, setShowOnlyExclusive] = useState(false);
	const releaseIdentifier =
		props?.releaseIdentifier ?? getSlugOrId(router.query);
	const theme = useTheme();
	const playTracks = useSetAtom(playTracksAtom);
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
	const hasGenres = (albumGenres.items?.length ?? 1) > 0;
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
		() => relatedPlaylists.items,
		[relatedPlaylists.items],
	);
	const { bSides, extras } = useMemo(
		() =>
			(bSidesQuery.items ?? []).reduce(
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
		[bSidesQuery.items],
	);
	const [isMixed, tracks, totalDuration, trackList] = useMemo(() => {
		if (tracklistQuery.data) {
			const discMap = tracklistQuery.data;
			const flatTracks = Array.from(Object.values(discMap)).flat();

			return [
				!flatTracks.some(({ mixed }) => !mixed),
				flatTracks,
				flatTracks.reduce(
					(prevDuration, track) =>
						prevDuration + (track.duration ?? 0),
					0,
				),
				discMap,
			];
		}
		return [undefined, [], undefined, undefined];
	}, [tracklistQuery.data]);
	const { videos, liveVideos, videoExtras } = useMemo(
		() =>
			(albumVideos.items ?? [])
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
		[albumVideos.items, tracks],
	);
	const label = useMemo(() => {
		return release.data?.label;
	}, [release.data]);
	const releaseDate = useMemo(() => {
		if (!album.data || !release.data) {
			return undefined;
		}
		const albumDate = getDate(album.data.releaseDate);
		const releaseReleaseDate = getDate(release.data.releaseDate);
		if (releaseReleaseDate) {
			if (
				releaseReleaseDate.getMonth() === 0 &&
				releaseReleaseDate.getDate() === 1 &&
				albumDate &&
				releaseReleaseDate.getFullYear() === albumDate.getFullYear()
			) {
				return albumDate;
			}
			return releaseReleaseDate;
		}
		return albumDate;
	}, [release.data, album.data]);
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
					<Grid
						size={{
							xl: 2,
							lg: 3,
							sm: 5,
							xs: 8,
						}}
					>
						<Illustration
							illustration={illustration}
							quality="original"
						/>
					</Grid>
					<Grid
						size={{
							xs: 12,
							sm: 7,
							lg: 6,
							xl: "grow",
						}}
						sx={{
							width: "100%",
							display: "flex",
						}}
					>
						<Stack
							direction={"column"}
							sx={{
								width: "100%",
								display: "flex",
								justifyContent: "space-evenly",
								alignItems: "left",
								[theme.breakpoints.down("sm")]: {
									alignItems: "center",
									textAlign: "center",
								},
							}}
						>
							<Box sx={{ width: "inherit" }}>
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
							</Box>
							{albumArtist !== null && (
								<Box>
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
											<Typography
												variant="h4"
												textAlign={"left"}
											>
												{albumArtist?.name ?? (
													<Skeleton width={"200px"} />
												)}
											</Typography>
										</Button>
									</Link>
								</Box>
							)}
							<Box
								style={{
									alignItems: "center",
									display: "inline-flex",
								}}
							>
								<Typography sx={{ color: "text.disabled" }}>
									{release.data?.extensions.join(" - ") ?? (
										<br />
									)}
								</Typography>
							</Box>
							<Box
								style={{
									alignItems: "center",
									display: "inline-flex",
								}}
							>
								<Typography
									sx={{ color: "text.disabled" }}
									component={"span"}
								>
									{releaseDate &&
										`${formatReleaseDate(releaseDate, i18n.language)} - `}
									{totalDuration !== undefined ? (
										<>
											{`${formatDuration(totalDuration)}`}
											{isMixed &&
												` - ${t("track.mixed")}`}
										</>
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
										value={
											externalMetadata.data.rating / 20
										}
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
													color: theme.vars.palette
														.text.disabled,
												}}
												opacity={0.2}
											/>
										}
									/>
								)}
							</Box>
						</Stack>
					</Grid>
					<Grid
						container
						sx={{
							spacing: 5,
							alignItems: "center",
							justifyContent: "space-evenly",
							display: "flex",
						}}
						size={{
							lg: 3,
							xs: 12,
						}}
					>
						{[PlayIcon, ShuffleIcon].map((Icon, index) => (
							<Grid key={index}>
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
						<Grid>
							{release.data && (
								<ReleaseContextualMenu release={release.data} />
							)}
						</Grid>
					</Grid>
				</Grid>
				<Grid
					container
					spacing={1}
					sx={{ display: "flex", paddingTop: 2 }}
				>
					{hasGenres && (
						<Grid
							marginTop={1}
							size={{
								xl: 2,
								lg: 3,
								xs: 12,
							}}
						>
							<Fade in>
								<Box>
									<Grid
										container
										spacing={1}
										sx={{ alignItems: "center" }}
									>
										<Grid>
											<ListSubheader
												sx={{
													backgroundColor:
														"transparent",
													lineHeight: "normal",
												}}
											>
												{`${t("models.genre_plural")}: `}
											</ListSubheader>
										</Grid>
										{(
											albumGenres?.items ??
											generateArray(3)
										)
											.sort(
												(a, b) =>
													a.slug.length -
													b.slug.length,
											)
											.slice(0, 10)
											.map((genre, index) => (
												<Grid
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
						id={"release-tracklist"}
						size={{
							xl: "grow",
							lg: hasGenres ? 9 : "grow",
							xs: 12,
						}}
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
											? "album.showAllTracks"
											: "album.showOnlyExclusiveTracks",
									)}
								</ListItemButton>
							)}
					</Grid>
				</Grid>
				<Box
					sx={{
						display: "flex",
						justifyContent: "right",
						paddingTop: label !== null ? 1 : 2,
					}}
				>
					{!album.data || label === undefined ? (
						<Skeleton width={"100px"} />
					) : label ? (
						<Typography
							sx={{
								color: "text.disabled",
							}}
						>
							{album.data.releaseDate
								? `${getYear(album.data.releaseDate)} - `
								: undefined}
							<Link
								href={`/labels/${release.data?.label?.slug}`}
								style={{
									textDecoration: "underline",
									textDecorationColor: "text.disabled",
								}}
							>
								{release.data?.label?.name}
							</Link>
						</Typography>
					) : (
						<></>
					)}
				</Box>
				<RelatedContentSection
					display={(bSides.length ?? 0) > 0}
					title={t("album.bonusTracks")}
				>
					<SongGrid
						parentArtistName={albumArtist?.name}
						songs={bSides ?? []}
					/>
				</RelatedContentSection>
				<RelatedContentSection
					display={(relatedReleases.items?.length ?? 0) > 1}
					title={t("album.otherAlbumReleases")}
				>
					<TileRow
						tiles={
							relatedReleases.items
								?.filter(
									(relatedRelease) =>
										relatedRelease.id !== release.data?.id,
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
						title={t(`browsing.sections.${sectionLabel}`)}
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
					title={t("browsing.sections.extras")}
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
					display={(relatedAlbums.items?.length ?? 0) > 0}
					title={t("album.relatedAlbums")}
				>
					<TileRow
						tiles={
							relatedAlbums.items?.map(
								(otherAlbum, otherAlbumIndex) => (
									<AlbumTile
										key={otherAlbumIndex}
										album={otherAlbum}
										formatSubtitle={(albumItem) =>
											getYear(
												albumItem.releaseDate,
											)?.toString() ?? ""
										}
									/>
								),
							) ?? []
						}
					/>
				</RelatedContentSection>
				<RelatedContentSection
					display={
						featurings !== undefined && featurings.length !== 0
					}
					title={t("album.onThisAlbum")}
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
					title={t("browsing.sections.featuredOnPlaylists")}
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
					<RelatedContentSection
						display
						title={t("browsing.sections.about")}
					>
						<Box sx={{ paddingBottom: 2 }}>
							<ResourceDescription
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
					title={t("models.externalLink_plural")}
				>
					<Grid container spacing={1}>
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
						))}
					</Grid>
				</RelatedContentSection>
			</Container>
		</>
	);
};

ReleasePage.prepareSSR = prepareSSR;

export default ReleasePage;
