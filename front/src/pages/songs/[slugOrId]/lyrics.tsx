import { Box } from "@mui/material";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { QueryClient, dehydrate } from "react-query";
import API from "../../../api/api";
import { WideLoadingComponent } from "../../../components/loading/loading";
import LyricsBox from "../../../components/lyrics";
import { SongWithArtist } from "../../../models/song";
import { prepareMeeloQuery, useQuery } from "../../../api/use-query";
import getSlugOrId from "../../../utils/getSlugOrId";
import SongRelationPageHeader from "../../../components/relation-page-header/song-relation-page-header";
import { useRouter } from "next/router";

const songQuery = (songSlugOrId: number | string) => ({
	key: ["song", songSlugOrId],
	exec: () => API.getSong<SongWithArtist>(songSlugOrId, ["artist"])
});

const lyricsQuery = (songSlugOrId: number | string) => ({
	key: [
		"song",
		songSlugOrId,
		"lyrics"
	],
	exec: () => API.getSongLyrics(songSlugOrId)
});

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const songIdentifier = getSlugOrId(context.params);
	const queryClient = new QueryClient();

	await Promise.all([
		queryClient.prefetchQuery(
			prepareMeeloQuery(songQuery, songIdentifier)
		),
		queryClient.prefetchQuery(prepareMeeloQuery(lyricsQuery, songIdentifier))
	]);

	return {
		props: {
			songIdentifier,
			dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
		},
	};
};

const SongLyricsPage = (
	{ songIdentifier }: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
	const router = useRouter();

	songIdentifier ??= getSlugOrId(router.query);
	const lyrics = useQuery(lyricsQuery, songIdentifier);
	const song = useQuery(songQuery, songIdentifier);

	if (!song.data || lyrics.isLoading) {
		return <WideLoadingComponent/>;
	}
	return <Box sx={{ width: '100%' }}>
		<SongRelationPageHeader song={song.data}/>
		<Box sx={{ paddingX: 5, paddingY: 2 }}>
			<LyricsBox songName={song.data.name} lyrics={lyrics.data}/>
		</Box>
	</Box>;
};

export default SongLyricsPage;
