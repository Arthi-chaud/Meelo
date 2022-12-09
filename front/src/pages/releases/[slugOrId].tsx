import {
	Button, Divider, Grid, IconButton,
	ListSubheader, Typography, useTheme
} from "@mui/material";
import { Box } from "@mui/system";
import { useRouter } from "next/router";
import API from "../../api/api";
import Illustration from "../../components/illustration";
import { WideLoadingComponent } from "../../components/loading/loading";
import { ReleaseWithAlbum } from "../../models/release";
import formatDuration from '../../utils/formatDuration';
import { useEffect, useState } from "react";
import Track, { TrackWithSong } from "../../models/track";
import Tracklist from "../../models/tracklist";
import Link from 'next/link';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { Shuffle } from "@mui/icons-material";
import FadeIn from "react-fade-in";
import Tile from "../../components/tile/tile";
import { useQueries, useQuery } from "../../api/use-query";
import { useDispatch } from "react-redux";
import { playTrack, playTracks } from "../../state/playerSlice";
import Song from "../../models/song";
import Artist from "../../models/artist";
import { shuffle } from 'd3-array';
import getSlugOrId from "../../utils/getSlugOrId";
import ReleaseTrackList from "../../components/release-tracklist";
import prepareSSR, { InferSSRProps } from "../../ssr";
import ReleaseContextualMenu from "../../components/contextual-menu/release-contextual-menu";

const releaseQuery = (slugOrId: string | number) => ({
	key: ['release', slugOrId],
	exec: () => API.getRelease<ReleaseWithAlbum>(slugOrId, ['album'])
});

const tracklistQuery = (releaseSlugOrId: string | number) => ({
	key: [
		'release',
		releaseSlugOrId,
		'tracklist'
	],
	exec: () => API.getReleaseTrackList<TrackWithSong>(releaseSlugOrId, ['song']),
});

const artistQuery = (slugOrId: string | number) => ({
	key: ['artist', slugOrId],
	exec: () => API.getArtist(slugOrId!),
});

const albumGenresQuery = (slugOrId: string | number) => ({
	key: [
		'album',
		slugOrId,
		'genres'
	],
	exec: () => API.getAlbumGenres(slugOrId),
});

const songVideosQuery = (slugOrId: string | number) => ({
	key: [
		'song',
		slugOrId,
		'video'
	],
	exec: () => API.getSongVideos(slugOrId, { pageSize: 1 }, { sortBy: 'id' })
		.then((page) => page.items.at(0)),
});

const albumReleasesQuery = (slugOrId: string | number) => ({
	key: [
		'album',
		slugOrId,
		'releases'
	],
	exec: () => API.getAlbumReleases(slugOrId, {}),
});

export const getServerSideProps = prepareSSR((context) => {
	const releaseIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { releaseIdentifier },
		queries: [releaseQuery(releaseIdentifier), tracklistQuery(releaseIdentifier)]
	};
});

type RelatedContentSectionProps = {
	display: boolean,
	title: string,
	children: JSX.Element;
}

const RelatedContentSection = (props: RelatedContentSectionProps) => {
	if (props.display == false) {
		return <></>;
	}
	return (
		<FadeIn>
			<Divider/>
			<Box sx={{ padding: 3 }}>
				<Typography variant='h6' sx={{ paddingBottom: 3 }}>{props.title}</Typography>
				{props.children}
			</Box>
		</FadeIn>
	);
};

const getSongArtist = (song: Song, albumArtist?: Artist, otherArtists: Artist[] = []): Artist => {
	if (song.artistId == albumArtist?.id) {
		return albumArtist;
	}
	return otherArtists.find((otherArtist) => otherArtist.id == song.artistId)!;
};

const ReleasePage = (
	{ releaseIdentifier }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	releaseIdentifier ??= getSlugOrId(router.query);
	const theme = useTheme();
	const dispatch = useDispatch();
	const [trackList, setTracklist] = useState<Tracklist<TrackWithSong>>();
	const [totalDuration, setTotalDuration] = useState<number | null>(null);
	const [tracks, setTracks] = useState<TrackWithSong[]>([]);

	const release = useQuery(releaseQuery, releaseIdentifier);
	const artistId = release.data?.album?.artistId;

	const tracklist = useQuery(tracklistQuery, releaseIdentifier);
	const albumArtist = useQuery(artistQuery, artistId);
	const albumGenres = useQuery(albumGenresQuery, release.data?.albumId);
	const hasGenres = (albumGenres.data?.length ?? 0) > 0;
	const otherArtistsQuery = useQueries(...tracks
		.filter((track: TrackWithSong) => track.song.artistId != albumArtist.data?.id)
		.map((track): Parameters<typeof useQuery<Artist>> => [artistQuery, track.song.artistId]));
	const videos = useQueries(...tracks
		.filter(
			(track: TrackWithSong, index) => tracks.findIndex(
				(otherTrack) => otherTrack.songId == track.songId
			) == index
		)
		.map((track): Parameters<typeof useQuery<Track | undefined>> =>
			[songVideosQuery, track.song.id]));
	const relatedReleases = useQuery(albumReleasesQuery, release.data?.albumId);

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
	if (!release.data || (artistId && !albumArtist.data)) {
		return <WideLoadingComponent/>;
	}
	return <Box>
		<Box sx={{ padding: 5, flex: 1, flexGrow: 1 }}>
			<Grid container spacing={4} sx={{ justifyContent: 'center' }}>
				<Grid item md={3} xs={8}>
					<Illustration url={release.data!.illustration}/>
				</Grid>
				<Grid item container
					sx={{
						width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly',
						alignItems: 'left', [theme.breakpoints.down('md')]: { alignItems: 'center', textAlign: 'center' }
					}}
					md={6} sm={9} xs={12}
				>
					<Grid item sx={{ width: 'inherit' }}>
						<Typography variant='h3' fontWeight='bold'>{release.data!.name}</Typography>
					</Grid>
					{albumArtist.data &&
						<Grid item>
							<Link href={`/artists/${albumArtist.data.slug}`}>
								<Button variant='text' sx={{ textTransform: 'none' }}>
									<Typography variant='h4'>{albumArtist.data.name}</Typography>

								</Button>
							</Link>
						</Grid>
					}
					<Grid item>
						<Typography fontWeight='light'>
							{release.data!.album.releaseDate && `${new Date(release.data!.album.releaseDate!).getFullYear()} - `}{formatDuration(totalDuration ?? undefined)}
						</Typography>
					</Grid>
				</Grid>
				<Grid item container md={3}
					xs={12} sx={{ spacing: 5, alignItems: 'center', justifyContent: 'space-evenly', display: 'flex' }}>
					{[() => <PlayCircleIcon fontSize="large"/>, () => <Shuffle fontSize="large"/>].map((icon, index) =>
						<Grid item key={index}>
							<IconButton onClick={() => {
								if (tracks && !otherArtistsQuery.find((query) => !query.data)) {
									const otherArtists = otherArtistsQuery
										.map((query) => query.data!);
									let playlist = tracks.map((track) => ({
										track: track,
										artist: getSongArtist(
											track.song, albumArtist.data, otherArtists
										),
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
						{ albumGenres.data &&
						<FadeIn>
							<Grid container spacing={1} sx={{ alignItems: 'center' }}>
								<Grid item>
									<ListSubheader>Genres:</ListSubheader>
								</Grid>
								{ albumGenres.data.map((genre) =>
									<Grid item key={genre.id} sx={{ display: 'flex' }}>
										<Link href={`/genres/${genre.slug}`}>
											<Button variant="outlined" color='inherit'>
												{ genre.name }
											</Button>
										</Link>
									</Grid>)}
							</Grid>
							<Divider sx={{
								paddingY: 1,
								display: "none",
								[theme.breakpoints.down('md')]: {
									display: 'block'
								}
							}} />
						</FadeIn>
						}
					</Grid>
				}
				<Grid item md={hasGenres ? 9 : true} xs={12}>
					{ albumGenres.data && trackList &&
						otherArtistsQuery.findIndex((query) => query.data == undefined) == -1 &&
						<FadeIn>
							<ReleaseTrackList
								mainArtist={albumArtist.data}
								tracklist={Object.fromEntries(Array.from(Object.entries(trackList))
									.map(([discKey, discTracks]) => [
										discKey,
										discTracks.map((discTrack) => ({
											...discTrack,
											song: {
												...discTrack.song,
												// eslint-disable-next-line max-len
												artist: discTrack.song.artistId == albumArtist.data?.id
													? albumArtist.data!
													: otherArtistsQuery.find(
														// eslint-disable-next-line max-len
														(otherArtist) => otherArtist.data?.id == discTrack.song.artistId
													)!.data!
											}
										}))
									]))
								}
								release={release.data}
							/>
						</FadeIn>
					}
				</Grid>
			</Grid>
			<RelatedContentSection
				display={(relatedReleases.data?.items?.length ?? 0) > 1}
				title={"Other releases of the same album"}
			>
				<Grid container spacing={2}>
					{ relatedReleases.data?.items?.filter(
						(relatedRelease) => relatedRelease.id != release.data!.id
					).map((otherRelease) =>
						<Grid key={otherRelease.id} item xs={6} sm={4} md={2} lg={2}>
							<Tile
								href={`/releases/${albumArtist?.data?.slug ?? 'compilations'}+${release.data!.album.slug}+${otherRelease.slug}/`}
								title={otherRelease.name}
								subtitle={otherRelease.releaseDate
									? new Date(otherRelease.releaseDate).getFullYear().toString()
									: undefined
								}
								illustration={<Illustration url={otherRelease.illustration}/>}
							/>
						</Grid>)
					}
				</Grid>
			</RelatedContentSection>
			<RelatedContentSection
				display={videos.filter((video) => video.data !== undefined).length >= 1}
				title={"Music Videos"}
			>
				<Grid container spacing={2}>
					{ videos.filter(
						(video) => video.data !== undefined
					).map((video) => video.data!).map((video) =>
						<Grid key={video.id} item xs={6} sm={4} md={2} lg={2}>
							<Tile
								onClick={() => {
									const parentSong = Object.values(trackList!)
										.flat()
										.find((track) => track.songId == video.songId)?.song;

									if (!parentSong) {
										// Should never happen
										return;
									}
									const parentArtist = getSongArtist(
										parentSong,
										albumArtist.data,
										otherArtistsQuery
											.filter((query) => !query.data)
											.map((query) => query.data!)
									);

									dispatch(playTrack({
										track: video,
										release: release.data,
										artist: parentArtist

									}));
								}}
								title={video.name}
								subtitle={formatDuration(video.duration)}
								illustration={
									<Illustration aspectRatio={16/9} url={video.illustration} style={{ objectFit: 'cover' }}/>
								}
							/>
						</Grid>)
					}
				</Grid>
			</RelatedContentSection>
		</Box>
	</Box>;
};

export default ReleasePage;
