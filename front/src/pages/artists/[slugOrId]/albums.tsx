import { Typography, Box } from "@mui/material";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/router";
import { dehydrate, QueryClient, useQuery } from "react-query";
import API from "../../../api";
import InfiniteAlbumView from "../../../components/infinite/infinite-album-view";
import { Page } from "../../../components/infinite/infinite-scroll";
import InfiniteView from "../../../components/infinite/infinite-view";
import AlbumItem from "../../../components/list-item/album-item";
import ModalPage from "../../../components/modal-page";
import AlbumTile from "../../../components/tile/album-tile";
import Album, { AlbumSortingKeys, AlbumWithArtist } from "../../../models/album";
import { prepareMeeloInfiniteQuery, prepareMeeloQuery } from "../../../query";
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
	const artistIdentifier = context.params!.slugOrId as string;
	const queryClient = new QueryClient()
  
	await Promise.all([
		await queryClient.prefetchQuery(prepareMeeloQuery(artistQuery, artistIdentifier)),
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
	const router = useRouter();
	artistIdentifier ??= router.query.slugOrId as string;
	return <InfiniteAlbumView
		initialSortingField={'releaseDate'}
		initialSortingOrder={'desc'}
		initialView={'grid'}
		query={(sort) => artistAlbumsQuery(artistIdentifier, sort)}
	/>
}
export default ArtistAlbumsPage;