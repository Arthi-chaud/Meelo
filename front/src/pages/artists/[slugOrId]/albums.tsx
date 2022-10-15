import { Typography, Box } from "@mui/material";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/router";
import { dehydrate, QueryClient, useQuery } from "react-query";
import API from "../../../api";
import InfiniteAlbumView from "../../../components/infinite/infinite-album-view";
import { Page } from "../../../components/infinite/infinite-scroll";
import Album, { AlbumSortingKeys, AlbumWithArtist } from "../../../models/album";
import { prepareMeeloInfiniteQuery, prepareMeeloQuery } from "../../../query";
import getSlugOrId from "../../../utils/getSlugOrId";
import { SortingParameters } from "../../../utils/sorting";

const artistAlbumsQuery = (artistSlugOrId: number | string, sort?: SortingParameters<typeof AlbumSortingKeys>) => ({
	key: ["artist", artistSlugOrId, "albums", sort ?? {}],
	exec: (lastPage: Page<Album>) => API.getArtistAlbums<AlbumWithArtist>(artistSlugOrId, lastPage, sort, ["artist"])
});

const artistQuery = (slugOrId: string | number) => ({
	key: ['artist', slugOrId],
	exec: () => API.getArtist(slugOrId),
});

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const artistIdentifier = getSlugOrId(context.params);
	const queryClient = new QueryClient()
  
	await Promise.all([
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(artistAlbumsQuery, artistIdentifier))
	]);
  
	return {
		props: {
			artistIdentifier,
			dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
		},
	}
}

const ArtistAlbumsPage = ({ artistIdentifier }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	artistIdentifier ??= getSlugOrId();
	return <InfiniteAlbumView
		initialSortingField={'releaseDate'}
		initialSortingOrder={'desc'}
		initialView={'grid'}
		query={(sort) => artistAlbumsQuery(artistIdentifier, sort)}
	/>
}
export default ArtistAlbumsPage;