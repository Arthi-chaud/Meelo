import { Grid, IconButton, ListItem, Typography, List, ListSubheader, ListItemText, Divider, ListItemIcon, Fade, useTheme, ListItemButton } from "@mui/material";
import { Box } from "@mui/system";
import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import { useRouter } from "next/router";
import API from "../../api";
import Illustration from "../../components/illustration";
import { WideLoadingComponent } from "../../components/loading/loading";
import { ReleaseWithAlbum, ReleaseWithTracks } from "../../models/release";
import formatDuration from 'format-duration'
import { useEffect, useState } from "react";
import { TrackWithSong } from "../../models/track";
import Tracklist from "../../models/tracklist";
import AspectRatio from '@mui/joy/AspectRatio';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { MoreHoriz, Shuffle } from "@mui/icons-material";
import FadeIn from "react-fade-in";
import Tile from "../../components/tile/tile";
import MusicVideoIcon from '@mui/icons-material/MusicVideo';
import { prepareMeeloQuery } from "../../query";
import { QueryClient, dehydrate, useQuery, useQueries } from "react-query";

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

const ReleasePage = ({ releaseIdentifier }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const theme = useTheme();
	const [totalDuration, setTotalDuration] = useState<number | null>(null);
	const [tracks, setTracks] = useState<TrackWithSong[] | null>(null);
	const [formattedTrackList, setFormattedTracklist] = useState<Tracklist<TrackWithSong>>();

	const release = useQuery(prepareMeeloQuery(releaseQuery, releaseIdentifier));
	let artistId = release.data?.album?.artistId;
	
	const tracklist = useQuery(prepareMeeloQuery(tracklistQuery, releaseIdentifier));
	const albumArtist = useQuery(prepareMeeloQuery(artistQuery, artistId));
	const albumGenres = useQuery(prepareMeeloQuery(albumGenresQuery, release.data?.albumId));
	const albumVideos = useQuery(prepareMeeloQuery(albumVideosQuery, release.data?.albumId));

	const otherArtistsQuery = useQueries((tracks ?? [])
		.filter((track: TrackWithSong) => track.song.artistId != albumArtist.data?.id)
		.map((track) => prepareMeeloQuery(artistQuery, track.song.artistId))
	);
	const relatedReleases = useQuery(prepareMeeloQuery(albumReleasesQuery, release.data?.albumId));
	useEffect(() => {
		if (tracklist.data) {
			setFormattedTracklist(new Map(Object.entries(tracklist.data)));
		}
	}, [tracklist.data]);
	useEffect(() => {
		if (formattedTrackList) {
			const flattenedTracks = Array.from(formattedTrackList.values()).flat();
			setTotalDuration(flattenedTracks.reduce((prevDuration, track) => prevDuration + track.duration, 0));
		}
	}, [formattedTrackList]);
	if (release.isLoading || albumArtist.isLoading)
		return <WideLoadingComponent/>
	return <Box>
		<Box sx={{ padding: 5, flex: 1, flexGrow: 1}}>
			<Grid container spacing={4} sx={{ justifyContent: 'center' }}>
				<Grid item md={4} xs={12}>
					<AspectRatio ratio="1">
						<Illustration url={release.data!.illustration} height={'40%'}/>
					</AspectRatio> 
				</Grid>
				<Grid item sx={{ display: 'flex' }} lg={5} md={8} xs={12} >
					<Grid container sx={{ flexDirection: 'column', justifyContent: 'space-evenly',
						alignItems: 'left', [theme.breakpoints.down('md')]: { alignItems: 'center' },
					}}>
						<Grid item>
							<Typography variant='h2'>{release.data!.name}</Typography>
						</Grid>
						{albumArtist.data &&
							<Grid item>
								<Typography  variant='h3'>{albumArtist.data?.name}</Typography>
							</Grid>
						}
						<Grid item>
							<Typography variant='h6'>
								{new Date(release.data!.album.releaseDate!).getFullYear()}{totalDuration && ` - ${formatDuration(totalDuration * 1000)}`}
							</Typography>
						</Grid>
					</Grid>
				</Grid>
				<Grid item container lg={3} xs={12} sx={{ spacing: 5, alignItems: 'center', justifyContent: 'space-evenly', display: 'flex'}}>
					<Grid item>
						<IconButton><PlayCircleIcon fontSize="large"/></IconButton>
					</Grid>
					<Grid item>
						<IconButton><Shuffle fontSize="large"/></IconButton>
					</Grid>
					<Grid item>
						<IconButton><MoreHoriz fontSize="large"/></IconButton>
					</Grid>
				</Grid>
			</Grid>
			<Grid sx={{ display: 'flex', paddingY: 5 }}>
				<Grid item sx={{ flex: 3 }}>
					{ albumGenres.data &&
						<FadeIn>
							<List subheader={<ListSubheader>Genres</ListSubheader>}>
							{ albumGenres.data.map((genre) => 
								<ListItemButton key={genre.id}>
									<ListItemText inset>{ genre.name }</ListItemText>
								</ListItemButton>
							) }
							</List>
						</FadeIn>
					}
				</Grid>
				<Grid item sx={{ flex: 9 }}>
					{ formattedTrackList &&
						<>
							{ Array.from(formattedTrackList.entries()).map((disc, _, discs) => 
								<List key={disc[0]} subheader={ discs.length !== 1 && <ListSubheader>Disc {disc[0]}</ListSubheader> }>
									{ disc[1].map((track) => <>
										<ListItemButton key={track.id}>
											<ListItemIcon><Typography>{ track.trackIndex }</Typography></ListItemIcon>
											<ListItemText
												primary={track.name}
												secondary={
													track.song.artistId == albumArtist.data?.id ? undefined : 
													otherArtistsQuery.find((artistQuery) => artistQuery.data?.id == track.song.artistId)?.data?.name 
												}
											/>
											{ track.type == 'Video' &&
												<ListItemIcon><MusicVideoIcon color='disabled' fontSize="small"/></ListItemIcon>
											}
											<Typography>{formatDuration(track.duration * 1000)}</Typography>
										</ListItemButton>
										<Divider variant="inset"/>
									</>) }
								</List>
							) }
						</>
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
								illustrationURL={otherRelease.illustration}
								illustrationFallback={() => <Illustration url={release.data!.illustration}/>}
							/>
						</ListItem>
					
					)}
				</List>
			</RelatedContentSection>
		</Box>
	</Box>
}

export default ReleasePage;