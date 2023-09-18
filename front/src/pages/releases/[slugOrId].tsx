import {
	Button, Chip, Container, Divider, Grid, IconButton,
	ListSubheader, Stack, Typography, useMediaQuery, useTheme
} from "@mui/material";
import { Box } from "@mui/system";
import { useRouter } from "next/router";
import API from "../../api/api";
import Illustration from "../../components/illustration";
import formatDuration from '../../utils/formatDuration';
import { useMemo } from "react";
import Link from 'next/link';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { Shuffle } from "@mui/icons-material";
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

const releaseQuery = (releaseIdentifier: string | number) => API.getRelease(releaseIdentifier, ['album', 'externalIds']);
const releaseTracklistQuery = (releaseIdentifier: string | number) => API.getReleaseTrackList(releaseIdentifier, ['song']);
const albumQuery = (albumId: number) => API.getAlbum(albumId, ['externalIds']);
const artistsOnAlbumQuery = (albumId: number) => API.getArtistsOnAlbum(albumId);

const albumGenreQuery = (albumId: number) => API.getAlbumGenres(albumId);
const releaseBSidesQuery = (releaseId: number) => API.getReleaseBSides(releaseId, { sortBy: 'name' }, ['artist']);
const albumVideosQuery = (albumId: number) => API.getAlbumVideos(albumId);
const relatedAlbumsQuery = (albumId: number) => API.getRelatedAlbums(albumId, { sortBy: 'releaseDate' }, ['artist']);
const relatedReleasesQuery = (albumId: number) => API.getAlbumReleases(albumId);
const relatedPlaylistsQuery = (albumId: number) => API.getAlbumPlaylists(albumId);

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
	children: JSX.Element;
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

const ColorChips = (props: { colors: string[] }) => {
	return <Grid container spacing={2} width="100%" justifyContent="center" wrap="nowrap">
		{props.colors.map((color) => (
			<Grid item key={`color-chid-${color}`}>
				<Chip label="&nbsp;&nbsp;" size="small" style={{ backgroundColor: color }} />
			</Grid>
		))}
	</Grid>;
};

const ReleasePage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();
	const releaseIdentifier = props.additionalProps?.releaseIdentifier ?? getSlugOrId(router.query);
	const theme = useTheme();
	const viewIsInColumn = useMediaQuery(theme.breakpoints.down('md'));
	const dispatch = useDispatch();
	const release = useQuery(releaseQuery, releaseIdentifier);
	const artistId = useMemo(() => release.data?.album?.artistId, [release]);
	const mainIllustrationColors = release.data?.illustration?.colors ?? [];
	const album = useQuery(albumQuery, release.data?.albumId);
	const tracklistQuery = useQuery(releaseTracklistQuery, releaseIdentifier);
	const albumGenres = useInfiniteQuery(albumGenreQuery, release.data?.albumId);
	const hasGenres = (albumGenres.data?.pages.at(0)?.items.length ?? 0) > 0;
	const artists = useQuery(artistsOnAlbumQuery, release.data?.albumId);
	const albumVideos = useInfiniteQuery(albumVideosQuery, release.data?.albumId);
	const bSides = useInfiniteQuery(releaseBSidesQuery, release.data?.id);
	const relatedAlbums = useInfiniteQuery(relatedAlbumsQuery, release.data?.albumId);
	const relatedReleases = useInfiniteQuery(relatedReleasesQuery, release.data?.albumId);
	const relatedPlaylists = useInfiniteQuery(relatedPlaylistsQuery, release.data?.albumId);
	const videos = useMemo(() => albumVideos.data?.pages.at(0)?.items, [albumVideos]);
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

	// eslint-disable-next-line no-extra-parens
	if (!release.data || !album.data || !artists.data || !trackList) {
		return <LoadingPage/>;
	}
	return (
		<Container maxWidth={false} disableGutters={viewIsInColumn}
			sx={{ marginY: 3, marginX: 0 }}
		>
			<Grid container spacing={4} sx={{ justifyContent: 'center' }}>
				<Grid item md={3} sm={5} xs={8}>
					<Illustration illustration={release.data!.illustration}/>
				</Grid>
				<Grid item container
					sx={{
						width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly',
						alignItems: 'left', [theme.breakpoints.down('sm')]: { alignItems: 'center', textAlign: 'center' }
					}}
					md={6} sm={7} xs={12}
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
					<Grid item>
						<Typography sx={{ color: 'text.disabled' }}>
							{(release.data.releaseDate || release.data.album.releaseDate) &&
								`${new Date(release.data.releaseDate ?? release.data.album.releaseDate!).getFullYear()} - `}
							{formatDuration(totalDuration ?? undefined)}
						</Typography>
					</Grid>
				</Grid>
				<Grid item container md={3}
					xs={12} sx={{ spacing: 5, alignItems: 'center', justifyContent: 'space-evenly', display: 'flex' }}>
					{[() => <PlayCircleIcon fontSize="large"/>, () => <Shuffle fontSize="large"/>].map((icon, index) =>
						<Grid item key={index}>
							<IconButton onClick={() => {
								if (tracks && artists.data != undefined) {
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
					<Grid item md={3} xs={12}>
						<Fade in={albumGenres.data != undefined}>
							<Box>
								<Grid container spacing={1} sx={{ alignItems: 'center' }}>
									<Grid item>
										<ListSubheader><Translate translationKey="genres"/>:</ListSubheader>
									</Grid>
									{ albumGenres.data?.pages.at(0)?.items.map((genre) =>
										<Grid item key={genre.id} sx={{ display: 'flex' }}>
											<Link href={`/genres/${genre.slug}`}>
												<Button variant="outlined">
													{ genre.name }
												</Button>
											</Link>
										</Grid>) ?? []}
								</Grid>
								<Divider sx={{
									paddingY: 1,
									display: "none",
									[theme.breakpoints.down('md')]: {
										display: 'block'
									}
								}} />
							</Box>
						</Fade>
					</Grid>
				}
				<Grid item md={hasGenres ? 9 : true} xs={12}>
					{ albumGenres.data && trackList && artists.data &&
						<Fade in><Box>
							<ReleaseTrackList
								mainArtist={albumArtist}
								tracklist={Object.fromEntries(Array.from(Object.entries(trackList))
									.map(([discKey, discTracks]) => [
										discKey,
										discTracks.map((discTrack) => ({
											...discTrack,
											song: {
												...discTrack.song,
												artist: artists.data.find(
													(artist) => artist.id == discTrack.song.artistId
												)!
											}
										}))
									]))
								}
								release={release.data}
							/>
						</Box></Fade>
					}
				</Grid>
			</Grid>
			<Box sx={{ padding: 2 }}>
				<ColorChips colors={mainIllustrationColors} />
			</Box>
			<RelatedContentSection
				display={(bSides.data?.pages.at(0)?.items?.length ?? 0) > 0}
				title={<Translate translationKey="bonusTracks"/>}
			>
				<SongGrid songs={bSides.data?.pages.at(0)?.items ?? []} hideArtistName/>
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
			<RelatedContentSection
				display={[...album.data.externalIds, ...release.data.externalIds].length != 0}
				title={<Translate translationKey="externalLinks"/>}
			>
				<Stack spacing={2}>
					{[...album.data.externalIds, ...release.data.externalIds].map((externalId) =>
						<ExternalIdBadge key={externalId.provider.name} externalId={externalId}/>)
					}
				</Stack>
			</RelatedContentSection>
		</Container>
	);
};

export default ReleasePage;
