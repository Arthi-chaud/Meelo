import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { QueryClient, dehydrate } from "react-query";
import API from "../../../api";
import { Page } from "../../../components/infinite/infinite-scroll";
import InfiniteSongView from "../../../components/infinite/infinite-song-view";
import Song, { SongSortingKeys, SongWithArtist } from "../../../models/song";
import { prepareMeeloInfiniteQuery } from "../../../query";
import getSlugOrId from "../../../utils/getSlugOrId";
import { SortingParameters } from "../../../utils/sorting";

const songVersionsQuery = (songSlugOrId: number | string, sort?: SortingParameters<typeof SongSortingKeys>) => ({
	key: ["song", songSlugOrId, "versions", sort ?? {}],
	exec: (lastPage: Page<SongWithArtist>) => API.getSongVersions<SongWithArtist>(songSlugOrId, lastPage, sort, ['artist'])
});

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const songIdentifier = getSlugOrId(context.params);
	const queryClient = new QueryClient()
  
	await Promise.all([
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(songVersionsQuery, songIdentifier))
	]);
  
	return {
		props: {
			songIdentifier,
			dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
		},
	}
}

const SongVersionsPage = ({ songIdentifier }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	songIdentifier ??= getSlugOrId();
	return <InfiniteSongView
		query={(sort) => songVersionsQuery(songIdentifier, sort)}
	/>
}
export default SongVersionsPage;