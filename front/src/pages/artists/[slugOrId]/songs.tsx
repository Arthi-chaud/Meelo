import { Typography, Box } from "@mui/material";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/router";
import { dehydrate, QueryClient, useQuery } from "react-query";
import API from "../../../api";
import InfiniteAlbumView from "../../../components/infinite/infinite-album-view";
import { Page } from "../../../components/infinite/infinite-scroll";
import InfiniteSongView from "../../../components/infinite/infinite-song-view";
import Album, { AlbumSortingKeys, AlbumWithArtist } from "../../../components/list-item/album";
import Song, { SongSortingKeys, SongWithArtist } from "../../../models/song";
import { prepareMeeloInfiniteQuery, prepareMeeloQuery } from "../../../query";
import getSlugOrId from "../../../utils/getSlugOrId";
import { SortingParameters } from "../../../utils/sorting";
import ArtistRelationPageHeader from "../../../components/relation-page-header/artist-relation-page-header";

const artistSongsQuery = (artistSlugOrId: number | string, sort?: SortingParameters<typeof SongSortingKeys>) => ({
	key: ["artist", artistSlugOrId, "songs", sort ?? {}],
	exec: (lastPage: Page<SongWithArtist>) => API.getArtistSongs<SongWithArtist>(artistSlugOrId, lastPage, sort, ['artist'])
});


export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const artistIdentifier = getSlugOrId(context.params);
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
	const router = useRouter();
	artistIdentifier ??= getSlugOrId(router.query);
	return <Box sx={{ width: '100%' }}>
		<ArtistRelationPageHeader artistSlugOrId={artistIdentifier}/>
		<InfiniteSongView
			initialSortingField={'name'}
			initialSortingOrder={'asc'}
			query={(sort) => artistSongsQuery(artistIdentifier, sort)}
		/>
	</Box>
}
export default ArtistAlbumsPage;