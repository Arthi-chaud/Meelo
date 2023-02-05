import API from "../../../api/api";
import getSlugOrId from "../../../utils/getSlugOrId";
import InfiniteReleaseView from "../../../components/infinite/infinite-resource-view/infinite-release-view";
import AlbumRelationPageHeader from "../../../components/relation-page-header/album-relation-page-header";
import { Box } from "@mui/material";
import { useRouter } from "next/router";
import prepareSSR, { InferSSRProps } from "../../../ssr";

export const getServerSideProps = prepareSSR((context) => {
	const albumIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { albumIdentifier },
		infiniteQueries: [API.getAlbumReleases(albumIdentifier, undefined, ['album'])]
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
			query={(sort) => API.getAlbumReleases(albumIdentifier, sort, ['album'])}
		/>
	</Box>;
};

export default AlbumReleasesPage;
