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
import SongContextualMenu from "../../../components/contextual-menu/song-contextual-menu";
import RelationPageHeader from "../../../components/relation-page-header/relation-page-header";
import SongRelationPageHeader from "../../../components/relation-page-header/song-relation-page-header";
import { useRouter } from "next/router";

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
	const router = useRouter();
	songIdentifier ??= getSlugOrId(router.query);
	const lyrics = useQuery(prepareMeeloQuery(lyricsQuery, songIdentifier));
	const song = useQuery(prepareMeeloQuery(songQuery, songIdentifier));
	if (!song.data || lyrics.isLoading ) {
		return <WideLoadingComponent/>
	}
	return <Box sx={{ width: '100%' }}>
		<SongRelationPageHeader song={song.data}/>
		<Box sx={{ paddingX: 5, paddingY: 2 }}>
			<LyricsBox songName={song.data.name} lyrics={lyrics.data}/>
		</Box>
	</Box>

}
export default SongLyricsPage;