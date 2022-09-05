import { Grid, IconButton, Typography } from "@mui/material";
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
import Track from "../../src/models/track";
import Genre from "../../src/models/genre";
import AspectRatio from '@mui/joy/AspectRatio';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { MoreHoriz, Shuffle } from "@mui/icons-material";

const ReleasePage: NextPage = () => {
	const router = useRouter();
	const { slugOrId } = router.query;
	const releaseIdentifier = slugOrId as string;
	const [totalDuration, setTotalDuration] = useState<number | null>(null);
	const [tracks, setTracks] = useState<Track[] | null>(null);
	const [genres, setGenres] = useState<Genre[] | null>(null);
	const releaseQuery = useQuery(
		['release', releaseIdentifier],
		() => API.getRelease(releaseIdentifier, ['album']) as Promise<ReleaseWithAlbum>,
		{ enabled: !!slugOrId }
	);
	let artistId = releaseQuery.data?.album?.artistId;
	const artistQuery = useQuery(
		['artist', artistId],
		() => API.getArtist(artistId!),
		{ enabled: !!artistId }
	); 
	const tracklistQuery = useQuery(
		['tracklist', releaseIdentifier],
		() => API.getReleaseTrackList(releaseIdentifier),
		{ enabled: !!slugOrId }
	);
	const genresQuery = useQueries(tracks?.map((track) => ({
		queryKey: ['song', track?.songId, 'genres'],
		queryFn: () => API.getSongGenres(track!.songId),
		enabled: !!tracks
	})) ?? []);
	useEffect(() => {
		if (tracklistQuery.data) {
			const flattenedTracks = Array.from(tracklistQuery.data!.values()).flat();
			setTracks(flattenedTracks);
			setTotalDuration(flattenedTracks.reduce((prevDuration, track) => prevDuration + track.duration, 0));
		}
	}, [tracklistQuery.data]);
	useEffect(() => {
		let newGenres = genres ?? [];
		genresQuery.map((query) => query.data?.items ?? []).flat().forEach((genre) => {
			if (newGenres.find((newGenre) => genre.id == newGenre.id) == undefined)
				newGenres.push(genre);
			setGenres(newGenres);
		})

	}, [genresQuery]);
	if (releaseQuery.isLoading || artistQuery.isLoading || slugOrId == undefined)
		return <WideLoadingComponent/>
	return (
		<Box sx={{ paddingX: 20, paddingY: 15, flex: 1, border: 1, flexGrow: 1}}>
			<Box sx={{ border: 1 }}>
				<Grid container sx={{ justifyContent: 'center' }} columns={20}>
					<Grid item flex={3}>
						<AspectRatio ratio="1">
							<Illustration url={releaseQuery.data!.illustration}/>
						</AspectRatio> 
						{/* <Box sx={{ border: 1, height: 100, width: "100%" }}/> */}
					</Grid>
					<Grid item sx={{ flex: 12, display: 'flex', border: 1, paddingLeft: 10  }} >
						<Grid container sx={{ flexDirection: 'column', justifyContent: 'space-evenly' }}>
							<Grid item>
								<Typography>{releaseQuery.data!.title}</Typography>
							</Grid>
							<Grid item>
								<Typography>{artistQuery.data!.name}</Typography>
							</Grid>
							<Grid item>
								<Typography>
									{new Date(releaseQuery.data!.album.releaseDate!).getFullYear()}{totalDuration && ` - ${formatDuration(totalDuration * 1000)}`}
								</Typography>
							</Grid>
						</Grid>
					</Grid>
					<Grid item container sx={{ flex: 3, spacing: 5, alignItems: 'center', justifyContent: 'space-evenly', display: 'flex'}}>
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
			</Box>
		</Box>
	)
}

export default ReleasePage;