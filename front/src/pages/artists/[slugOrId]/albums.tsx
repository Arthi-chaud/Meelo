import { Box } from "@mui/material";
import { useRouter } from "next/router";
import API from "../../../api/api";
import InfiniteAlbumView from "../../../components/infinite/infinite-resource-view/infinite-album-view";
import getSlugOrId from "../../../utils/getSlugOrId";
import ArtistRelationPageHeader from "../../../components/relation-page-header/artist-relation-page-header";
import prepareSSR, { InferSSRProps } from "../../../ssr";
import getYear from "../../../utils/getYear";
import { getLayoutParams } from "../../../utils/layout";

const defaultSort = {
	sortBy: 'releaseDate',
	order: 'desc'
} as const;

export const getServerSideProps = prepareSSR((context) => {
	const artistIdentifier = getSlugOrId(context.params);
	const defaultLayout = getLayoutParams(context.query.view) ?? 'grid';

	return {
		additionalProps: { artistIdentifier, defaultLayout },
		queries: [API.getArtist(artistIdentifier)],
		infiniteQueries: [API.getAlbums({ artist: artistIdentifier }, defaultSort, ['artist'])]
	};
});

const ArtistAlbumsPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();
	const artistIdentifier = props.additionalProps?.artistIdentifier ?? getSlugOrId(router.query);

	return <Box sx={{ width: '100%' }}>
		<ArtistRelationPageHeader artistSlugOrId={artistIdentifier}/>
		<InfiniteAlbumView
			defaultLayout={props.additionalProps?.defaultLayout}
			initialSortingField={defaultSort.sortBy}
			initialSortingOrder={defaultSort.order}
			formatSubtitle={(album) => getYear(album.releaseDate)?.toString() ?? ''}
			query={({ sortBy, order, library, type }) => API.getAlbums(
				{ artist: artistIdentifier, type, library: library ?? undefined }, { sortBy, order }, ['artist']
			)}
		/>
	</Box>;
};

export default ArtistAlbumsPage;
