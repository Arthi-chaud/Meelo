import Release, { ReleaseSortingKeys } from "../../../models/release";
import API from "../../../api";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { QueryClient, dehydrate } from "react-query";
import { Page } from "../../../components/infinite/infinite-scroll";
import InfiniteTrackView from "../../../components/infinite/infinite-track-view";
import { prepareMeeloInfiniteQuery } from "../../../query";
import getSlugOrId from "../../../utils/getSlugOrId";
import { SortingParameters } from "../../../utils/sorting";
import InfiniteReleaseView from "../../../components/infinite/infinite-release-view";

const albumReleasesQuery = (albumSlugOrId: number | string, sort?: SortingParameters<typeof ReleaseSortingKeys>) => ({
	key: ["album", albumSlugOrId, "releases", sort ?? {}],
	exec: (lastPage: Page<Release>) => API.getAlbumReleases<Release>(albumSlugOrId, lastPage, sort)
});


export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const albumIdentifier = getSlugOrId(context.params);
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
	albumIdentifier ??= getSlugOrId();
	return <InfiniteReleaseView
		query={(sort) => albumReleasesQuery(albumIdentifier, sort)}
	/>
}
export default AlbumReleasesPage;