import { Box } from "@mui/material";
import { useRouter } from "next/router";
import API from "../../../api/api";
import InfiniteAlbumView from "../../../components/infinite/infinite-resource-view/infinite-album-view";
import { Page } from "../../../components/infinite/infinite-scroll";
import Album, {
	AlbumSortingKeys, AlbumType, AlbumWithArtist
} from "../../../models/album";
import getSlugOrId from "../../../utils/getSlugOrId";
import { SortingParameters } from "../../../utils/sorting";
import ArtistRelationPageHeader from "../../../components/relation-page-header/artist-relation-page-header";
import prepareSSR, { InferSSRProps } from "../../../ssr";

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

export const getServerSideProps = prepareSSR((context) => {
	const artistIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { artistIdentifier },
		infiniteQueries: [artistAlbumsQuery(artistIdentifier)]
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
			query={(sort, type) => artistAlbumsQuery(artistIdentifier, sort, type)}
		/>
	</Box>;
};

export default ArtistAlbumsPage;
