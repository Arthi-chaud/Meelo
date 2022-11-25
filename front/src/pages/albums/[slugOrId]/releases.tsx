import { ReleaseSortingKeys, ReleaseWithAlbum } from "../../../models/release";
import API from "../../../api/api";
import { Page } from "../../../components/infinite/infinite-scroll";
import getSlugOrId from "../../../utils/getSlugOrId";
import { SortingParameters } from "../../../utils/sorting";
import InfiniteReleaseView from "../../../components/infinite/infinite-release-view";
import AlbumRelationPageHeader from "../../../components/relation-page-header/album-relation-page-header";
import { Box } from "@mui/material";
import { useRouter } from "next/router";
import prepareSSR, { InferSSRProps } from "../../../ssr";

const albumReleasesQuery = (
	albumSlugOrId: number | string, sort?: SortingParameters<typeof ReleaseSortingKeys>
) => ({
	key: [
		"album",
		albumSlugOrId,
		"releases",
		sort ?? {}
	],
	exec: (lastPage: Page<ReleaseWithAlbum>) => API.getAlbumReleases<ReleaseWithAlbum>(
		albumSlugOrId, lastPage, sort, ['album']
	)
});

export const getServerSideProps = prepareSSR((context) => {
	const albumIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { albumIdentifier },
		infiniteQueries: [albumReleasesQuery(albumIdentifier)]
	};
});

const AlbumReleasesPage = (
	{ albumIdentifier }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	albumIdentifier ??= getSlugOrId(router.query);
	return <Box sx={{ width: '100%' }}>
		<AlbumRelationPageHeader albumSlugOrId={albumIdentifier}/>
		<InfiniteReleaseView
			query={(sort) => albumReleasesQuery(albumIdentifier, sort)}
		/>
	</Box>;
};

export default AlbumReleasesPage;
