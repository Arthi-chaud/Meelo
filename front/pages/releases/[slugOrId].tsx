import { Grid, IconButton, ListItem, Typography, List, ListSubheader, ListItemText, Divider, ListItemIcon } from "@mui/material";
import { Box } from "@mui/system";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useQueries, useQuery } from "react-query";
import API from "../../src/api";
import Illustration from "../../src/components/illustration";
import { WideLoadingComponent } from "../../src/components/loading/loading";
import { ReleaseWithAlbum } from "../../src/models/release";
import formatDuration from 'format-duration'
import { useEffect, useState } from "react";
import Track, { TrackWithSong } from "../../src/models/track";
import AspectRatio from '@mui/joy/AspectRatio';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { MoreHoriz, Shuffle } from "@mui/icons-material";
import FadeIn from "react-fade-in";

const ReleasePage: NextPage = () => {
	const router = useRouter();
	const { slugOrId } = router.query;
	const releaseIdentifier = slugOrId as string;
	const [totalDuration, setTotalDuration] = useState<number | null>(null);
	const [tracks, setTracks] = useState<TrackWithSong[] | null>(null);
	const releaseQuery = useQuery(
		['release', releaseIdentifier],
		() => API.getRelease<ReleaseWithAlbum>(releaseIdentifier, ['album']),
		{ enabled: !!slugOrId }
	);
	let artistId = releaseQuery.data?.album?.artistId;
	const albumArtistQuery = useQuery(
		['artist', artistId],
		() => API.getArtist(artistId!),
		{ enabled: !!artistId }
	); 
	const tracklistQuery = useQuery(
		['tracklist', releaseIdentifier],
		() => API.getReleaseTrackList<TrackWithSong>(releaseIdentifier, ['song']),
		{ enabled: !!slugOrId }
	);
	const genresQuery = useQuery(
		['album', releaseQuery.data?.albumId, 'genres'],
		() => API.getAlbumGenres(releaseQuery.data!.albumId),
		{ enabled: !!releaseQuery.data }
	);
	const otherArtistsQuery = useQueries(tracks?.filter(
			(track: TrackWithSong) => track.song.artistId != albumArtistQuery.data?.id
		).map((track) => ({
			queryKey: ['artist', track.song.id],
			queryFn: () => API.getArtist(track.song.artistId),
			enabled: !!tracklistQuery.data
		})) ?? []
	);
	useEffect(() => {
		if (tracklistQuery.data) {
			const flattenedTracks = Array.from(tracklistQuery.data!.values()).flat();
			setTracks(flattenedTracks);
			setTotalDuration(flattenedTracks.reduce((prevDuration, track) => prevDuration + track.duration, 0));
		}
	}, [tracklistQuery.data]);
	if (releaseQuery.isLoading || albumArtistQuery.isLoading || slugOrId == undefined)
		return <WideLoadingComponent/>
	return (
		<Box sx={{ padding: 5, flex: 1, border: 1, flexGrow: 1}}>
			<Box sx={{ border: 1 }}>
				<Grid container sx={{ justifyContent: 'center' }}>
					<Grid item md={4} xs={12}>
						<AspectRatio ratio="1">
							<Illustration url={releaseQuery.data!.illustration} height={'40%'}/>
						</AspectRatio> 
					</Grid>
					<Grid item sx={{ display: 'flex', border: 1, paddingLeft: 10  }} lg={5} md={8} xs={12} >
						<Grid container sx={{ flexDirection: 'column', justifyContent: 'space-evenly' }}>
							<Grid item>
								<Typography>{releaseQuery.data!.title}</Typography>
							</Grid>
							{albumArtistQuery.data &&
								<Grid item>
									<Typography>{albumArtistQuery.data?.name}</Typography>
								</Grid>
							}
							<Grid item>
								<Typography>
									{new Date(releaseQuery.data!.album.releaseDate!).getFullYear()}{totalDuration && ` - ${formatDuration(totalDuration * 1000)}`}
								</Typography>
							</Grid>
						</Grid>
					</Grid>
					<Grid item container lg={3} xs={12} sx={{ spacing: 5, alignItems: 'center', justifyContent: 'space-evenly', display: 'flex'}}>
						<Grid item>
							<IconButton><PlayCircleIcon/></IconButton>
						</Grid>
						<Grid item>
							<IconButton><Shuffle/></IconButton>
						</Grid>
						<Grid item>
							<IconButton><MoreHoriz/></IconButton>
						</Grid>
					</Grid>
				</Grid>
				<Grid sx={{ display: 'flex' }}>
					<Grid item sx={{ border: 1, flex: 3 }}>
						{ genresQuery.data &&
							<FadeIn>
								<List>
									<ListItem>
										<ListItemText>Genres :</ListItemText>
									</ListItem>
								{ genresQuery.data.map((genre) => 
									<ListItem key={genre.id}>
										<ListItemText inset>{ genre.name }</ListItemText>
									</ListItem>
								) }
								</List>
							</FadeIn>
						}
					</Grid>
					<Grid item sx={{ border: 1, flex: 9 }}>
						{ tracklistQuery.data &&
							<FadeIn>
								{ Array.from(tracklistQuery.data.entries()).map((disc, _, discs) => 
									<List key={disc[0]} subheader={ discs.length !== 1 && <ListSubheader>Disc {disc[0]}</ListSubheader> }>
										{ disc[1].map((track) => <>
											<ListItem key={track.id}>
												<ListItemIcon><Typography>{ track.trackIndex }</Typography></ListItemIcon>
												<ListItemText
													primary={track.displayName}
													secondary={
														track.song.artistId == albumArtistQuery.data?.id ? undefined : 
														otherArtistsQuery.find((artistQuery) => artistQuery.data?.id == track.song.artistId)?.data?.name 
													}
												/>
											</ListItem>
											<Divider variant="inset"/>
										</>) }
									</List>
								) }
							</FadeIn>
						}
					</Grid>
				</Grid>
			</Box>
		</Box>
	)
}

export default ReleasePage;