import {
	Button, Chip, Container, Divider, Fade, Grid, IconButton,
	ListSubheader, Stack, Typography, useMediaQuery, useTheme
} from "@mui/material";
import { Box } from "@mui/system";
import { useRouter } from "next/router";
import API from "../../api/api";
import Illustration from "../../components/illustration";
import formatDuration from '../../utils/formatDuration';
import {
	useEffect, useMemo, useState
} from "react";
import Tracklist from "../../models/tracklist";
import Link from 'next/link';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { Shuffle } from "@mui/icons-material";
import { useInfiniteQuery, useQuery } from "../../api/use-query";
import { useDispatch } from "react-redux";
import { playTracks } from "../../state/playerSlice";
import { shuffle } from 'd3-array';
import getSlugOrId from "../../utils/getSlugOrId";
import ReleaseTrackList from "../../components/release-tracklist";
import prepareSSR, { InferSSRProps } from "../../ssr";
import ReleaseContextualMenu from "../../components/contextual-menu/release-contextual-menu";
import LoadingPage from "../../components/loading/loading-page";
import TileRow from "../../components/tile-row";
import { TrackWithRelations } from "../../models/track";
import VideoTile from "../../components/tile/video-tile";
import ExternalIdBadge from "../../components/external-id-badge";
import Translate from "../../i18n/translate";
import ArtistTile from "../../components/tile/artist-tile";
import PlaylistTile from "../../components/tile/playlist-tile";
import ReleaseTile from "../../components/tile/release-tile";
import SongGrid from "../../components/song-grid";
import AlbumTile from "../../components/tile/album-tile";

export const getServerSideProps = prepareSSR((context) => {
	const releaseIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { releaseIdentifier },
		queries: [API.getRelease(releaseIdentifier), API.getReleaseTrackList(releaseIdentifier)]
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

const ReleasePage = (
	{ releaseIdentifier }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	releaseIdentifier ??= getSlugOrId(router.query);
	const theme = useTheme();
	const viewIsInColumn = useMediaQuery(theme.breakpoints.down('md'));
	const dispatch = useDispatch();
	const [trackList, setTracklist] = useState<Tracklist<TrackWithRelations<'song'>>>();
	const [totalDuration, setTotalDuration] = useState<number | null>(null);
	const [tracks, setTracks] = useState<TrackWithRelations<'song'>[]>([]);

	const release = useQuery((id) => API.getRelease(id, ['album']), releaseIdentifier);
	const artistId = useMemo(() => release.data?.album?.artistId, [release]);

	const mainIllustrationColors = release.data?.illustration?.colors ?? [];
	const album = useQuery((id) => API.getAlbum(id, ['externalIds']), release.data?.albumId);
	const tracklist = useQuery((id) => API.getReleaseTrackList(id, ['song']), releaseIdentifier);
	const albumGenres = useInfiniteQuery(API.getAlbumGenres, release.data?.albumId);
	const hasGenres = (albumGenres.data?.pages.at(0)?.items.length ?? 0) > 0;
	const artists = useQuery(API.getArtistsOnAlbum, release.data?.albumId);
	const albumVideos = useInfiniteQuery(API.getAlbumVideos, release.data?.albumId);
	const bSides = useInfiniteQuery((id) => API.getReleaseBSides(id, { sortBy: 'name' }, ['artist']), release.data?.id);
	const relatedAlbums = useInfiniteQuery((id) => API.getRelatedAlbums(id, { sortBy: 'releaseDate' }, ['artist']), release.data?.albumId);
	const relatedReleases = useInfiniteQuery(API.getAlbumReleases, release.data?.albumId);
	const relatedPlaylists = useInfiniteQuery(API.getAlbumPlaylists, release.data?.albumId);
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

	useEffect(() => {
		if (tracklist.data) {
			const discMap = tracklist.data;
			const flatTracks = Array.from(Object.values(discMap)).flat();

			setTracks(flatTracks);
			setTotalDuration(
				flatTracks.reduce((prevDuration, track) => prevDuration + track.duration, 0)
			);
			setTracklist(discMap);
		}
	}, [tracklist.data]);
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
				display={album.data.externalIds.length != 0}
				title={<Translate translationKey="externalLinks"/>}
			>
				<Stack spacing={2}>
					{album.data.externalIds.map((externalId) =>
						<ExternalIdBadge key={externalId.provider.name} externalId={externalId}/>)
					}
				</Stack>
			</RelatedContentSection>
		</Container>
	);
};

export default ReleasePage;
