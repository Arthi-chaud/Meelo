import { Grid, IconButton, ListItem, Typography, List, ListSubheader, ListItemText, Divider, ListItemIcon, Fade, useTheme, ListItemButton, Button } from "@mui/material";
import { Box } from "@mui/system";
import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import { useRouter } from "next/router";
import API from "../../api";
import Illustration from "../../components/illustration";
import { WideLoadingComponent } from "../../components/loading/loading";
import { ReleaseWithAlbum, ReleaseWithTracks } from "../../models/release";
import formatDuration from '../../utils/formatDuration';
import { useEffect, useState } from "react";
import { TrackWithSong } from "../../models/track";
import Tracklist from "../../models/tracklist";

import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { Album, MoreHoriz, Shuffle } from "@mui/icons-material";
import FadeIn from "react-fade-in";
import Tile from "../../components/tile/tile";
import MusicVideoIcon from '@mui/icons-material/MusicVideo';
import { prepareMeeloQuery } from "../../query";
import { QueryClient, dehydrate, useQuery, useQueries } from "react-query";
import { useDispatch } from "react-redux";
import { playNextTrack, playTrack, setTracksInPlaylist } from "../../state/playerSlice";
import Song from "../../models/song";
import Artist from "../../models/artist";
import { shuffle } from 'd3-array';

const releaseQuery = (slugOrId: string | number) => ({
	key: ['release', slugOrId],
	exec: () => API.getRelease<ReleaseWithAlbum>(slugOrId, ['album'])
});

const tracklistQuery = (releaseSlugOrId: string | number) => ({
	key: ['release', releaseSlugOrId, 'tracklist'],
	exec: () => API.getReleaseTrackList<TrackWithSong>(releaseSlugOrId, ['song']),
});

const artistQuery = (slugOrId: string | number) => ({
	key: ['artist', slugOrId],
	exec: () => API.getArtist(slugOrId!),
});

const albumGenresQuery = (slugOrId: string | number) => ({
	key: ['album', slugOrId, 'genres'],
	exec: () => API.getAlbumGenres(slugOrId),
});

const albumVideosQuery = (slugOrId: string | number) => ({
	key: ['album', slugOrId, 'videos'],
	exec: () => API.getAlbumVideos(slugOrId),
});

const albumReleasesQuery = (slugOrId: string | number) => ({
	key: ['album', slugOrId, 'releases'],
	exec: () => API.getAlbumReleases<ReleaseWithTracks>(slugOrId, {}, undefined, ['tracks']),
});

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const releaseIdentifier = context.params!.slugOrId as string;
	const queryClient = new QueryClient()
  
	await Promise.all([
		queryClient.prefetchQuery(prepareMeeloQuery(releaseQuery, releaseIdentifier)),
		queryClient.prefetchQuery(prepareMeeloQuery(tracklistQuery, releaseIdentifier))
	]);
  
	return {
		props: {
			releaseIdentifier,
			dehydratedState: dehydrate(queryClient),
		},
	}
}

type RelatedContentSectionProps = {
	display: boolean,
	title: string,
	children: JSX.Element;
}

const RelatedContentSection = (props: RelatedContentSectionProps) => {
	if (props.display == false)
		return <></>
	return (
		<FadeIn>
			<Divider/>
			<Typography variant='h6' sx={{ paddingTop: 3 }}>{props.title}</Typography>
			{props.children}
		</FadeIn>
	)
}

const getSongArtist = (song: Song, albumArtist?: Artist, otherArtist: Artist[] = []): Artist => {
	if (song.artistId == albumArtist?.id)
		return albumArtist;
	return otherArtist.find((otherArtist) => otherArtist.id == song.artistId)!; 
}

const ReleasePage = ({ releaseIdentifier }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const theme = useTheme();
	const dispatch = useDispatch();
	const [totalDuration, setTotalDuration] = useState<number | null>(null);
	const [tracks, setTracks] = useState<TrackWithSong[] | null>(null);
	const [formattedTrackList, setFormattedTracklist] = useState<Tracklist<TrackWithSong>>();

	const release = useQuery(prepareMeeloQuery(releaseQuery, releaseIdentifier));
	let artistId = release.data?.album?.artistId;
	
	const tracklist = useQuery(prepareMeeloQuery(tracklistQuery, releaseIdentifier));
	const albumArtist = useQuery(prepareMeeloQuery(artistQuery, artistId));
	const albumGenres = useQuery(prepareMeeloQuery(albumGenresQuery, release.data?.albumId));
	const hasGenres = (albumGenres.data?.length ?? 0) > 0;
	const albumVideos = useQuery(prepareMeeloQuery(albumVideosQuery, release.data?.albumId));

	const otherArtistsQuery = useQueries((tracks ?? [])
		.filter((track: TrackWithSong) => track.song.artistId != albumArtist.data?.id)
		.map((track) => prepareMeeloQuery(artistQuery, track.song.artistId))
	);
	const relatedReleases = useQuery(prepareMeeloQuery(albumReleasesQuery, release.data?.albumId));
	useEffect(() => {
		if (tracklist.data) {
			const discMap = new Map(Object.entries(tracklist.data));
			setTracks(Array.from(discMap.values()).flat())
			setFormattedTracklist(discMap);
		}
	}, [tracklist.data]);
	useEffect(() => {
		if (formattedTrackList) {
			const flattenedTracks = Array.from(formattedTrackList.values()).flat();
			setTotalDuration(flattenedTracks.reduce((prevDuration, track) => prevDuration + track.duration, 0));
		}
	}, [formattedTrackList]);
	if (!release.data || !albumArtist)
		return <WideLoadingComponent/>
	return <Box>
		<Box sx={{ padding: 5, flex: 1, flexGrow: 1}}>
			<Grid container spacing={4} sx={{ justifyContent: 'center' }}>
				<Grid item md={3} xs={8}>
					<Illustration url={release.data!.illustration} fallback={<Album/>}/> 
				</Grid>
				<Grid item sx={{ display: 'flex' }} md={6} sm={9} xs={12} >
					<Grid container sx={{ flexDirection: 'column', justifyContent: 'space-evenly',
						alignItems: 'left', [theme.breakpoints.down('md')]: { alignItems: 'center', textAlign: 'center' },
					}}>
						<Grid item>
							<Typography variant='h3' fontWeight='bold'>{release.data!.name}</Typography>
						</Grid>
						{albumArtist.data &&
							<Grid item>
								<Typography  variant='h4'>{albumArtist.data?.name}</Typography>
							</Grid>
						}
						<Grid item>
							<Typography  fontWeight='light'>
								{new Date(release.data!.album.releaseDate!).getFullYear()}{` - ${formatDuration(totalDuration ?? undefined)}`}
							</Typography>
						</Grid>
					</Grid>
				</Grid>
				<Grid item container md={3} xs={12} sx={{ spacing: 5, alignItems: 'center', justifyContent: 'space-evenly', display: 'flex'}}>
					{[
						() => <PlayCircleIcon fontSize="large"/>,
						() => <Shuffle fontSize="large"/>
					].map((icon, index) => (
							<Grid item key={index}>
								<IconButton onClick={() => {
									if (tracks && otherArtistsQuery.findIndex((q) => q.data == undefined) == -1) {
										const otherArtists = otherArtistsQuery.map((q) => q.data!);
										let playlist = tracks.map((track) => ({
											track: track,
											artist: getSongArtist(track.song, albumArtist.data, otherArtists),
											release: release.data
										}));
										if (index == 1)
											playlist = shuffle(playlist);
										dispatch(setTracksInPlaylist(playlist));
										dispatch(playNextTrack());
									}
							}}>
									{icon()}
								</IconButton>
							</Grid>
						))
					}
					<Grid item>
						<IconButton><MoreHoriz fontSize="large"/></IconButton>
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
								{ albumGenres.data.map((genre) => (
									<Grid item xs="auto" key={genre.id}>
										<Button variant="outlined" color='inherit'>
											{ genre.name }
										</Button>
									</Grid>
								))}
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
				<Grid item md={ hasGenres ? 9 : true} xs={12}>
					{ albumGenres.data && formattedTrackList && otherArtistsQuery.findIndex((q) => q.data == undefined) == -1 &&
						<FadeIn>
							{ Array.from(formattedTrackList.entries()).map((disc, _, discs) => 
								<List key={disc[0]} subheader={ discs.length !== 1 && <ListSubheader>Disc {disc[0]}</ListSubheader> }>
									{ disc[1].map((track, _, tracks) => {
										const artist = getSongArtist(track.song, albumArtist.data, otherArtistsQuery.map((q) => q.data!))
										return <>
											<ListItemButton key={track.id} onClick={() => {
													if (tracks && otherArtistsQuery.findIndex((q) => q.data == undefined) == -1) {
														const otherArtists = otherArtistsQuery.map((q) => q.data!);
														const trackIndex = tracks.findIndex((t) => t.id == track.id);
														let playlist = tracks.slice(trackIndex).map((track) => ({
															track: track,
															artist: getSongArtist(track.song, albumArtist.data, otherArtists),
															release: release.data
														}));
														dispatch(setTracksInPlaylist(playlist));
														dispatch(playNextTrack());
													}
													dispatch(playTrack({
														track: track,
														artist: artist!,
														release: release.data!
													}));
												}}>
												<ListItemIcon><Typography>{ track.trackIndex }</Typography></ListItemIcon>
												<ListItemText
													primary={track.name}
													secondary={
														track.song.artistId == albumArtist.data?.id ? undefined : artist?.name
													}
												/>
												{ track.type == 'Video' &&
													<ListItemIcon><MusicVideoIcon color='disabled' fontSize="small"/></ListItemIcon>
												}
												<Typography>{formatDuration(track.duration)}</Typography>
											</ListItemButton>
											<Divider variant="inset"/>
										</>
									}) }
								</List>
							) }
						</FadeIn>
					}
				</Grid>
			</Grid>
			<RelatedContentSection
				display={(relatedReleases.data?.items?.length ?? 0) > 1}
				title={"Other releases of the same album:"}
			>
				<List>
					{ relatedReleases.data?.items.filter((relatedRelease) => relatedRelease.id != release.data!.id).map((otherRelease) =>
						<ListItem key={otherRelease.id}>
							<Tile
								targetURL={`/releases/${albumArtist?.data?.slug ?? 'compilations'}+${release.data!.album.slug}+${otherRelease.slug}/`}
								title={otherRelease.name}
								subtitle={`${otherRelease.tracks.length} Tracks`}
								illustration={<Illustration url={otherRelease.illustration} fallback={<Album/>}/>}
							/>
						</ListItem>
					
					)}
				</List>
			</RelatedContentSection>
		</Box>
	</Box>
}

export default ReleasePage;