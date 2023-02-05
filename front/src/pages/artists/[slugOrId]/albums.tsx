import { Box } from "@mui/material";
import { useRouter } from "next/router";
import API from "../../../api/api";
import InfiniteAlbumView from "../../../components/infinite/infinite-resource-view/infinite-album-view";
import getSlugOrId from "../../../utils/getSlugOrId";
import ArtistRelationPageHeader from "../../../components/relation-page-header/artist-relation-page-header";
import prepareSSR, { InferSSRProps } from "../../../ssr";
import getYear from "../../../utils/getYear";

export const getServerSideProps = prepareSSR((context) => {
	const artistIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { artistIdentifier },
		infiniteQueries: [API.getArtistAlbums(artistIdentifier, undefined, undefined, ['artist'])]
	};
});

const ArtistAlbumsPage = (
	{ artistIdentifier }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	artistIdentifier ??= getSlugOrId(router.query);
	return <Box sx={{ width: '100%' }}>
		<ArtistRelationPageHeader artistSlugOrId={artistIdentifier}/>
		<InfiniteAlbumView
			initialSortingField='releaseDate'
			initialSortingOrder='desc'
			formatSubtitle={(album) => getYear(album.releaseDate)?.toString() ?? ''}
			query={(sort, type) => API.getArtistAlbums(artistIdentifier, type, sort, ['artist'])}
		/>
	</Box>;
};

export default ArtistAlbumsPage;
