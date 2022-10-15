import { Box, Divider, Grid, Typography } from "@mui/material";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { QueryClient, dehydrate, useQuery } from "react-query";
import API from "../../../api";
import Illustration from "../../../components/illustration";
import { Page } from "../../../components/infinite/infinite-scroll";
import InfiniteTrackView from "../../../components/infinite/infinite-track-view";
import { WideLoadingComponent } from "../../../components/loading/loading";
import LyricsBox from "../../../components/lyrics";
import Song, { SongWithArtist } from "../../../models/song";
import Track, { TrackSortingKeys, TrackWithRelease } from "../../../models/track";
import { prepareMeeloInfiniteQuery, prepareMeeloQuery } from "../../../query";
import getSlugOrId from "../../../utils/getSlugOrId";
import { SortingParameters } from "../../../utils/sorting";
import SongTracksPage from "./tracks";

const songQuery = (songSlugOrId: number | string) => ({
	key: ["song", songSlugOrId],
	exec: () => API.getSong<SongWithArtist>(songSlugOrId, ["artist"])
});

const lyricsQuery = (songSlugOrId: number | string) => ({
	key: ["song", songSlugOrId, "lyrics"],
	exec: () => API.getSongLyrics(songSlugOrId)
});


export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const songIdentifier = getSlugOrId(context.params);
	const queryClient = new QueryClient()
  
	await Promise.all([
		await queryClient.prefetchQuery(prepareMeeloQuery(songQuery, songIdentifier)),
		await queryClient.prefetchQuery(prepareMeeloQuery(lyricsQuery, songIdentifier))
	]);
  
	return {
		props: {
			songIdentifier,
			dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
		},
	}
}

const SongLyricsPage = ({ songIdentifier }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	songIdentifier ??= getSlugOrId();
	const lyrics = useQuery(prepareMeeloQuery(lyricsQuery, songIdentifier));
	const song = useQuery(prepareMeeloQuery(songQuery, songIdentifier));
	if (!song.data || lyrics.isLoading ) {
		return <WideLoadingComponent/>
	}
	return <Box sx={{ width: '100%' }}>
		<Grid container sx={{ width: 'inherit', height: 'auto' }}>
			<Grid item xs={4} sm={3} md={2} xl={1} sx={{ padding: 3 }}>
				<Illustration url={song.data.illustration} fallback={<Box/>}/>
			</Grid>
			<Grid item container direction='column' xs sx={{ justifyContent: 'space-evenly' }}>
				<Grid item>
					<Typography variant='h5' sx={{ fontWeight: 'bold' }}>
						{song.data.name}
					</Typography>
				</Grid>
				<Grid item>
					<Typography>
						{ song.data.artist.name }
					</Typography>
				</Grid>
			</Grid>
		</Grid>
		<Divider variant="middle"/>
		<Box sx={{ paddingX: 5, paddingY: 2 }}>
			<LyricsBox songName={song.data.name} lyrics={lyrics.data}/>
		</Box>
	</Box>

}
export default SongLyricsPage;