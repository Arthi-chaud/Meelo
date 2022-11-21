import { Box } from "@mui/material";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/router";
import { QueryClient, dehydrate } from "react-query";
import API from "../../../api";
import InfiniteAlbumView from "../../../components/infinite/infinite-album-view";
import { Page } from "../../../components/infinite/infinite-scroll";
import Album, {
	AlbumSortingKeys, AlbumType, AlbumWithArtist
} from "../../../models/album";
import { prepareMeeloInfiniteQuery } from "../../../query";
import getSlugOrId from "../../../utils/getSlugOrId";
import { SortingParameters } from "../../../utils/sorting";
import ArtistRelationPageHeader from "../../../components/relation-page-header/artist-relation-page-header";

const artistAlbumsQuery = (
	artistSlugOrId: number | string,
	sort?: SortingParameters<typeof AlbumSortingKeys>,
	type?: AlbumType
) => ({
	key: [
		"artist",
		artistSlugOrId,
		"albums",
		sort ?? {},
		type ?? {}
	],
	exec: (lastPage: Page<Album>) =>
		API.getArtistAlbums<AlbumWithArtist>(artistSlugOrId, lastPage, type, sort, ["artist"])
});

const artistQuery = (slugOrId: string | number) => ({
	key: ['artist', slugOrId],
	exec: () => API.getArtist(slugOrId),
});

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const artistIdentifier = getSlugOrId(context.params);
	const queryClient = new QueryClient();

	await Promise.all([
		queryClient.prefetchInfiniteQuery(
			prepareMeeloInfiniteQuery(artistAlbumsQuery, artistIdentifier)
		)
	]);

	return {
		props: {
			artistIdentifier,
			dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
		},
	};
};

const ArtistAlbumsPage = (
	{ artistIdentifier }: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
	const router = useRouter();

	artistIdentifier ??= getSlugOrId(router.query);
	return <Box sx={{ width: '100%' }}>
		<ArtistRelationPageHeader artistSlugOrId={artistIdentifier}/>
		<InfiniteAlbumView
			initialSortingField={'releaseDate'}
			initialSortingOrder={'desc'}
			initialView={'grid'}
			query={(sort, type) => artistAlbumsQuery(artistIdentifier, sort, type)}
		/>
	</Box>;
};

export default ArtistAlbumsPage;
