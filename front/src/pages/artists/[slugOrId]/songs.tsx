import { Typography, Box } from "@mui/material";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/router";
import { dehydrate, QueryClient, useQuery } from "react-query";
import API from "../../../api";
import InfiniteAlbumView from "../../../components/infinite/infinite-album-view";
import { Page } from "../../../components/infinite/infinite-scroll";
import InfiniteSongView from "../../../components/infinite/infinite-song-view";
import Album, { AlbumSortingKeys, AlbumWithArtist } from "../../../models/album";
import Song, { SongSortingKeys, SongWithArtist } from "../../../models/song";
import { prepareMeeloInfiniteQuery, prepareMeeloQuery } from "../../../query";
import useSlugOrId from "../../../utils/useSlugOrId";
import { SortingParameters } from "../../../utils/sorting";

const artistSongsQuery = (artistSlugOrId: number | string, sort?: SortingParameters<typeof SongSortingKeys>) => ({
	key: ["artist", artistSlugOrId, "songs", sort ?? {}],
	exec: (lastPage: Page<SongWithArtist>) => API.getArtistSongs<SongWithArtist>(artistSlugOrId, lastPage, sort, ['artist'])
});


export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const artistIdentifier = useSlugOrId(context.params);
	const queryClient = new QueryClient()
  
	await Promise.all([
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(artistSongsQuery, artistIdentifier))
	]);
  
	return {
		props: {
			artistIdentifier,
			dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
		},
	}
}

const ArtistAlbumsPage = ({ artistIdentifier }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	artistIdentifier ??= useSlugOrId();
	return <InfiniteSongView
		initialSortingField={'name'}
		initialSortingOrder={'asc'}
		query={(sort) => artistSongsQuery(artistIdentifier, sort)}
	/>
}
export default ArtistAlbumsPage;