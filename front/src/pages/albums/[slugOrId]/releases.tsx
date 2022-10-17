import Release, { ReleaseSortingKeys, ReleaseWithAlbum } from "../../../models/release";
import API from "../../../api";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { QueryClient, dehydrate } from "react-query";
import { Page } from "../../../components/infinite/infinite-scroll";
import InfiniteTrackView from "../../../components/infinite/infinite-track-view";
import { prepareMeeloInfiniteQuery } from "../../../query";
import useSlugOrId from "../../../utils/useSlugOrId";
import { SortingParameters } from "../../../utils/sorting";
import InfiniteReleaseView from "../../../components/infinite/infinite-release-view";
import AlbumRelationPageHeader from "../../../components/relation-page-header/album-relation-page-header";
import { Box } from "@mui/material";

const albumReleasesQuery = (albumSlugOrId: number | string, sort?: SortingParameters<typeof ReleaseSortingKeys>) => ({
	key: ["album", albumSlugOrId, "releases", sort ?? {}],
	exec: (lastPage: Page<ReleaseWithAlbum>) => API.getAlbumReleases<ReleaseWithAlbum>(albumSlugOrId, lastPage, sort, ['album'])
});


export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const albumIdentifier = useSlugOrId(context.params);
	const queryClient = new QueryClient();
	await Promise.all([
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(albumReleasesQuery, albumIdentifier))
	]);
  
	return {
		props: {
			albumIdentifier,
			dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
		},
	}
}

const AlbumReleasesPage = ({ albumIdentifier }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	albumIdentifier ??= useSlugOrId();
	return <Box sx={{ width: '100%' }}>
		<AlbumRelationPageHeader albumSlugOrId={albumIdentifier}/>
		<InfiniteReleaseView
			query={(sort) => albumReleasesQuery(albumIdentifier, sort)}
		/>
	</Box>
	
}
export default AlbumReleasesPage;