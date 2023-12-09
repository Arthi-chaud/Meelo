import {
	Button, Container, Divider, Grid, IconButton,
	ListSubheader, Rating, Typography, useMediaQuery, useTheme
} from "@mui/material";
import { Box } from "@mui/system";
import { useRouter } from "next/router";
import API from "../../api/api";
import Illustration from "../../components/illustration";
import formatDuration from '../../utils/formatDuration';
import { useMemo } from "react";
import Link from 'next/link';
import { PlayCircledIcon, ShuffleIcon } from "../../components/icons";
import {
	prepareMeeloQuery, useInfiniteQuery, useQuery
} from "../../api/use-query";
import { useDispatch } from "react-redux";
import { playTracks } from "../../state/playerSlice";
import { shuffle } from 'd3-array';
import getSlugOrId from "../../utils/getSlugOrId";
import ReleaseTrackList from "../../components/release-tracklist";
import prepareSSR, { InferSSRProps } from "../../ssr";
import ReleaseContextualMenu from "../../components/contextual-menu/release-contextual-menu";
import LoadingPage from "../../components/loading/loading-page";
import TileRow from "../../components/tile-row";
import VideoTile from "../../components/tile/video-tile";
import ExternalIdBadge from "../../components/external-id-badge";
import Translate from "../../i18n/translate";
import ArtistTile from "../../components/tile/artist-tile";
import PlaylistTile from "../../components/tile/playlist-tile";
import ReleaseTile from "../../components/tile/release-tile";
import SongGrid from "../../components/song-grid";
import AlbumTile from "../../components/tile/album-tile";
import getYear from "../../utils/getYear";
import Fade from "../../components/fade";
import BackgroundBlurhash from "../../components/blurhash-background";
import ResourceDescriptionExpandable from "../../components/resource-description-expandable";
import { Star1 } from "iconsax-react";
import GenreButton from "../../components/genre-button";
import { SongWithRelations } from "../../models/song";
import Video from "../../models/video";

const releaseQuery = (releaseIdentifier: string | number) => API.getRelease(releaseIdentifier, ['album', 'externalIds']);
const releaseTracklistQuery = (releaseIdentifier: string | number) => API.getReleaseTrackList(releaseIdentifier, ['artist', 'featuring']);
const albumQuery = (albumId: number) => API.getAlbum(albumId, ['externalIds', 'genres']);
const artistsOnAlbumQuery = (albumId: number) => {
	const query = API.getArtists({ album: albumId });

	return {
		key: query.key,
		exec: () => query.exec({ pageSize: 10000 })
			.then((res) => res.items)
	};
};

const albumGenreQuery = (albumId: number) => API.getGenres({ album: albumId });
const releaseBSidesQuery = (releaseId: number) => API.getSongs({ bsides: releaseId }, { sortBy: 'name' }, ['artist', 'featuring']);
const albumVideosQuery = (albumId: number) => API.getVideos({ album: albumId });
const relatedAlbumsQuery = (albumId: number) => API.getAlbums({ related: albumId }, { sortBy: 'releaseDate' }, ['artist']);
const relatedReleasesQuery = (albumId: number) => API.getReleases({ album: albumId });
const relatedPlaylistsQuery = (albumId: number) => API.getPlaylists({ album: albumId });

export const getServerSideProps = prepareSSR(async (context, queryClient) => {
	const releaseIdentifier = getSlugOrId(context.params);
	const release = await queryClient.fetchQuery(
		prepareMeeloQuery(() => releaseQuery(releaseIdentifier))
	);

	return {
		additionalProps: { releaseIdentifier },
		queries: [
			releaseTracklistQuery(releaseIdentifier),
			albumQuery(release.albumId),
			artistsOnAlbumQuery(release.albumId)
		],
		infiniteQueries: [
			albumGenreQuery(release.albumId),
			releaseBSidesQuery(release.id),
			albumVideosQuery(release.albumId),
			relatedAlbumsQuery(release.albumId),
			relatedReleasesQuery(release.albumId),
			relatedPlaylistsQuery(release.albumId)
		]
	};
});

type RelatedContentSectionProps = {
	display: boolean,
	title: string | JSX.Element,
	children: JSX.Element[] | JSX.Element;
}

const RelatedContentSection = (props: RelatedContentSectionProps) => {
	return (
		<Fade in={props.display == true}>
			<Box sx={{ margin: 2, display: props.display ? undefined : 'none' }}>
				<Divider/>
				<Typography variant='h6' sx={{ paddingY: 3 }}>{props.title}</Typography>
				{props.children}
			</Box>
		</Fade>
	);
};

const ReleasePage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();
	const releaseIdentifier = props.additionalProps?.releaseIdentifier ?? getSlugOrId(router.query);
	const theme = useTheme();
	const viewIsInColumn = useMediaQuery(theme.breakpoints.down('lg'));
	const dispatch = useDispatch();
	const release = useQuery(releaseQuery, releaseIdentifier);
	const artistId = useMemo(() => release.data?.album?.artistId, [release]);
	const album = useQuery(albumQuery, release.data?.albumId);
	const tracklistQuery = useQuery(releaseTracklistQuery, releaseIdentifier);
	const albumGenres = useInfiniteQuery(albumGenreQuery, release.data?.albumId);
	const hasGenres = (albumGenres.data?.pages.at(0)?.items.length ?? 0) > 0;
	const artists = useQuery(artistsOnAlbumQuery, release.data?.albumId);
	const albumVideos = useInfiniteQuery(albumVideosQuery, release.data?.albumId);
	const bSidesQuery = useInfiniteQuery(releaseBSidesQuery, release.data?.id);
	const relatedAlbums = useInfiniteQuery(relatedAlbumsQuery, release.data?.albumId);
	const relatedReleases = useInfiniteQuery(relatedReleasesQuery, release.data?.albumId);
	const relatedPlaylists = useInfiniteQuery(relatedPlaylistsQuery, release.data?.albumId);
	const albumArtist = useMemo(
		() => artists.data?.find((artist) => artist.id === artistId),
		[artistId, artists]
	);
	const featurings = useMemo(
		() => artists.data?.filter((artist) => artist.id !== artistId),
		[artistId, artists]
	);
	const playlists = useMemo(
		() => relatedPlaylists.data?.pages.at(0)?.items,
		[relatedPlaylists.data]
	);
	const { bSides, extras } = (bSidesQuery.data?.pages.at(0)?.items ?? []).reduce((
		(prev, current) => {
			if (current.type === 'NonMusic') {
				return { bSides: prev.bSides, extras: prev.extras.concat(current) };
			}
			return { bSides: prev.bSides.concat(current), extras: prev.extras };
		}),
		{ bSides: [], extras: [] } as Record<'bSides' | 'extras', SongWithRelations<'artist' | 'featuring'>[]>);
	const { videos, videoExtras } = (albumVideos.data?.pages.at(0)?.items ?? []).reduce((
		(prev, current) => {
			if (current.type === 'NonMusic') {
				return { videos: prev.videos, videoExtras: prev.videoExtras.concat(current) };
			}
			return { videos: prev.videos.concat(current), videoExtras: prev.videoExtras };
		}),
		{ videos: [], videoExtras: [] } as Record<'videos' | 'videoExtras', Video[]>);
	const [tracks, totalDuration, trackList] = useMemo(() => {
		if (tracklistQuery.data) {
			const discMap = tracklistQuery.data;
			const flatTracks = Array.from(Object.values(discMap)).flat();

			return [
				flatTracks,
				flatTracks.reduce((prevDuration, track) => prevDuration + track.duration, 0),
				discMap
			];
		}
		return [[], null, undefined];
	}, [tracklistQuery.data]);
	const illustration = useMemo(() => release.data?.illustration, [release]);
	const externalIdWithDescription = album.data?.externalIds
		.find(({ description }) => description !== null);
	const albumRating = album.data?.externalIds
		.map(({ rating }) => rating)
		.filter((rating) => rating !== null)
		.sort().at(-1) ?? null;
	const colors = Array.of(...illustration?.colors ?? []).sort();

	// eslint-disable-next-line no-extra-parens
	if (!release.data || !album.data || !artists.data || !trackList) {
		return <LoadingPage/>;
	}
	return <>
		<Container maxWidth={false} disableGutters={viewIsInColumn}
			sx={{ marginTop: 3, marginX: 0, position: 'relative' }}
		>
			<BackgroundBlurhash blurhash={illustration?.blurhash} />
			<Grid container spacing={4} sx={{ justifyContent: 'center' }}>
				<Grid item lg={3} sm={5} xs={8}>
					<Illustration illustration={release.data!.illustration} quality="original"/>
				</Grid>
				<Grid item container
					sx={{
						width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly',
						alignItems: 'left', [theme.breakpoints.down('sm')]: { alignItems: 'center', textAlign: 'center' }
					}}
					lg={6} sm={7} xs={12}
				>
					<Grid item sx={{ width: 'inherit' }}>
						<Typography variant='h3' fontWeight='bold'>{release.data!.name}</Typography>
					</Grid>
					{albumArtist &&
						<Grid item>
							<Link href={`/artists/${albumArtist.slug}`}>
								<Button variant='text' sx={{ textTransform: 'none', position: 'relative', left: { xs: 0, sm: -8 } }}>
									<Typography variant='h4'>{albumArtist.name}</Typography>
								</Button>
							</Link>
						</Grid>
					}
					<Grid item style={{ alignItems: 'center', display: 'inline-flex' }}>
						<Typography sx={{ color: 'text.disabled' }} component={'span'}>
							{(release.data.releaseDate || release.data.album.releaseDate) &&
								`${new Date(release.data.releaseDate ?? release.data.album.releaseDate!).getFullYear()} - `}
							{formatDuration(totalDuration ?? undefined)}
						</Typography>
						{albumRating && <Rating
							sx={{ paddingLeft: 1.5 }}
							readOnly
							value={albumRating / 20}
							icon={<Star1 size={18} style={{ marginTop: -3 }} color={colors.at(4)}/>}
							emptyIcon={<Star1 size={18} style={{ marginTop: -3 }}
								color={theme.palette.text.disabled} opacity={0.2}
							/>}
						/>}
					</Grid>
				</Grid>
				<Grid item container lg={3}
					xs={12} sx={{ spacing: 5, alignItems: 'center', justifyContent: 'space-evenly', display: 'flex' }}>
					{[() => <PlayCircledIcon fontSize="large"/>, () => <ShuffleIcon fontSize="large"/>].map((icon, index) =>
						<Grid item key={index}>
							<IconButton onClick={() => {
								if (tracks && artists.data !== undefined) {
									let playlist = tracks.map((track) => ({
										track: track,
										artist: artists.data.find(
											(artist) => artist.id == track.song.artistId
										)!,
										release: release.data
									}));

									if (index == 1) {
										playlist = shuffle(playlist);
									}
									dispatch(playTracks({ tracks: playlist }));
								}
							}}>
								{icon()}
							</IconButton>
						</Grid>)
					}
					<Grid item>
						<ReleaseContextualMenu
							release={{ ...release.data, album: release.data.album }}
						/>
					</Grid>
				</Grid>
			</Grid>
			<Grid container spacing={1} sx={{ display: 'flex', paddingY: 2 }}>
				{ hasGenres &&
					<Grid item lg={3} xs={12} marginTop={1}>
						<Fade in={albumGenres.data != undefined}>
							<Box>
								<Grid container rowSpacing={1.5} spacing={1} sx={{ alignItems: 'center' }}>
									<Grid item>
										<ListSubheader sx={{ backgroundColor: 'transparent', lineHeight: 'normal' }}>
											<Translate translationKey="genres"/>:
										</ListSubheader>
									</Grid>
									{ albumGenres.data?.pages.at(0)?.items.map((genre) =>
										<Grid item key={genre.id} sx={{ display: 'flex' }}>
											<GenreButton genre={genre} color={colors.at(4)}/>
										</Grid>) ?? []}
								</Grid>
								<Divider sx={{
									paddingY: 1,
									display: "none",
									[theme.breakpoints.down('lg')]: {
										display: 'block'
									}
								}} />
							</Box>
						</Fade>
					</Grid>
				}
				<Grid item lg={hasGenres ? 9 : true} xs={12}>
					{ albumGenres.data && trackList && artists.data &&
						<Fade in><Box>
							<ReleaseTrackList
								mainArtist={albumArtist}
								tracklist={Object.fromEntries(Array.from(Object.entries(trackList))
									.map(([discKey, discTracks]) => [
										discKey,
										discTracks.map((discTrack) => ({
											...discTrack,
											song: discTrack.song
										}))
									]))
								}
								release={release.data}
							/>
						</Box></Fade>
					}
				</Grid>
			</Grid>
			<RelatedContentSection
				display={(bSides.length ?? 0) > 0}
				title={<Translate translationKey="bonusTracks"/>}
			>
				<SongGrid
					parentArtistName={albumArtist?.name}
					songs={bSides ?? []}
				/>
			</RelatedContentSection>
			<RelatedContentSection
				display={(relatedReleases.data?.pages.at(0)?.items?.length ?? 0) > 1}
				title={<Translate translationKey="otherAlbumReleases"/>}
			>
				<TileRow tiles={
					relatedReleases.data?.pages.at(0)?.items?.filter(
						(relatedRelease) => relatedRelease.id != release.data!.id
					).map((otherRelease, otherReleaseIndex) =>
						<ReleaseTile key={otherReleaseIndex}
							release={{ ...otherRelease, album: album.data }}
						/>) ?? []
				}/>
			</RelatedContentSection>
			<RelatedContentSection
				display={videos !== undefined && videos.length != 0}
				title={<Translate translationKey="musicVideos"/>}
			>
				<TileRow tiles={videos?.map((video, videoIndex) =>
					<VideoTile key={videoIndex} video={{ ...video.track, song: video }}/>) ?? []}
				/>
			</RelatedContentSection>
			<RelatedContentSection
				display={extras.length > 0 || videoExtras.length > 0}
				title={<Translate translationKey="extras"/>}
			>
				{extras.length > 0 ? <SongGrid
					parentArtistName={albumArtist?.name}
					songs={extras}
				/> : <></>}
				{videoExtras.length > 0 ? <TileRow tiles={videoExtras.map((video, videoIndex) =>
					<VideoTile key={videoIndex} video={{ ...video.track, song: video }}/>)}
				/> : <></>}
			</RelatedContentSection>
			<RelatedContentSection
				display={(relatedAlbums.data?.pages.at(0)?.items?.length ?? 0) > 0}
				title={<Translate translationKey="relatedAlbums"/>}
			>
				<TileRow tiles={
					relatedAlbums.data?.pages.at(0)?.items?.map(
						(otherAlbum, otherAlbumIndex) =>
							<AlbumTile key={otherAlbumIndex}
								album={otherAlbum}
								formatSubtitle={(albumItem) => getYear(albumItem.releaseDate)?.toString() ?? ''}
							/>
					) ?? []
				}/>
			</RelatedContentSection>
			<RelatedContentSection
				display={(featurings?.length ?? 0) != 0}
				title={<Translate translationKey="onThisAlbum"/>}
			>
				<TileRow tiles={featurings?.map((artist) =>
					<ArtistTile key={artist.id} artist={artist}/>)
				?? []}/>
			</RelatedContentSection>
			<RelatedContentSection
				display={(playlists?.length ?? 0) != 0}
				title={<Translate translationKey="featuredOnPlaylists"/>}
			>
				<TileRow tiles={playlists?.map((playlist) =>
					<PlaylistTile key={playlist.id} playlist={playlist}/>)
				?? []}/>
			</RelatedContentSection>
			{ externalIdWithDescription && <RelatedContentSection
				display title={<Translate translationKey="about"/>}
			>
				<Box sx={{ paddingBottom: 2 }}>
					<ResourceDescriptionExpandable externalDescription={externalIdWithDescription}/>
				</Box>
			</RelatedContentSection>}
			<RelatedContentSection
				display={[...album.data.externalIds, ...release.data.externalIds].length != 0}
				title={<Translate translationKey="externalLinks"/>}
			>
				<Grid container spacing={1}>
					{[...album.data.externalIds, ...release.data.externalIds]
						.filter(({ url }) => url !== null)
						.map((externalId) => <Grid item key={externalId.provider.name}>
							<ExternalIdBadge externalId={externalId}/>
						</Grid>)
					}
				</Grid>
			</RelatedContentSection>
		</Container>
	</>;
};

export default ReleasePage;
