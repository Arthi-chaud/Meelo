import {
	Button, Divider, Grid, IconButton, List, ListItem,
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
import { TrackWithSong } from "../../models/track";
import Tracklist from "../../models/tracklist";
import Link from 'next/link';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { Shuffle } from "@mui/icons-material";
import FadeIn from "react-fade-in";
import Tile from "../../components/tile/tile";
import { useQueries, useQuery } from "../../api/use-query";
import { useDispatch } from "react-redux";
import { playTracks } from "../../state/playerSlice";
import Song from "../../models/song";
import Artist from "../../models/artist";
import { shuffle } from 'd3-array';
import getSlugOrId from "../../utils/getSlugOrId";
import AlbumContextualMenu from "../../components/contextual-menu/album-contextual-menu";
import ReleaseTrackList from "../../components/release-tracklist";
import prepareSSR, { InferSSRProps } from "../../ssr";

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

const albumVideosQuery = (slugOrId: string | number) => ({
	key: [
		'album',
		slugOrId,
		'videos'
	],
	exec: () => API.getAlbumVideos(slugOrId),
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
			<Typography variant='h6' sx={{ paddingTop: 3 }}>{props.title}</Typography>
			{props.children}
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
	if (!release.data || !albumArtist) {
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
							<Typography variant='h4'>{albumArtist.data?.name}</Typography>
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
						<AlbumContextualMenu
							album={{ ...release.data.album, artist: albumArtist.data }}
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
				title={"Other releases of the same album:"}
			>
				<List>
					{ relatedReleases.data?.items?.filter(
						(relatedRelease) => relatedRelease.id != release.data!.id
					).map((otherRelease) => <ListItem key={otherRelease.id}>
						<Tile
							targetURL={`/releases/${albumArtist?.data?.slug ?? 'compilations'}+${release.data!.album.slug}+${otherRelease.slug}/`}
							title={otherRelease.name}
							subtitle={otherRelease.releaseDate
								? new Date(otherRelease.releaseDate).getFullYear().toString()
								: undefined
							}
							illustration={<Illustration url={otherRelease.illustration}/>}
						/>
					</ListItem>)}
				</List>
			</RelatedContentSection>
		</Box>
	</Box>;
};

export default ReleasePage;
