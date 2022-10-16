import { Typography, Box } from "@mui/material";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/router";
import { dehydrate, QueryClient, useQuery } from "react-query";
import API from "../../../api";
import InfiniteAlbumView from "../../../components/infinite/infinite-album-view";
import { Page } from "../../../components/infinite/infinite-scroll";
import InfiniteTrackView from "../../../components/infinite/infinite-track-view";
import Track, { TrackSortingKeys, TrackWithRelease, TrackWithSong } from "../../../models/track";
import { prepareMeeloInfiniteQuery } from "../../../query";
import useSlugOrId from "../../../utils/useSlugOrId";
import { SortingParameters } from "../../../utils/sorting";

const songTracksQuery = (songSlugOrId: number | string, sort?: SortingParameters<typeof TrackSortingKeys>) => ({
	key: ["song", songSlugOrId, "tracks", sort ?? {}],
	exec: (lastPage: Page<Track>) => API.getSongTracks<TrackWithRelease & TrackWithSong>(songSlugOrId, lastPage, sort, ["release", "song"])
});


export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const songIdentifier = useSlugOrId(context.params);
	const queryClient = new QueryClient()
  
	await Promise.all([
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(songTracksQuery, songIdentifier))
	]);
  
	return {
		props: {
			songIdentifier,
			dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
		},
	}
}

const SongTracksPage = ({ songIdentifier }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	songIdentifier ??= useSlugOrId();
	return <InfiniteTrackView
		initialSortingOrder={'asc'}
		query={(sort) => songTracksQuery(songIdentifier, sort)}
	/>
}
export default SongTracksPage;