import { Box } from "@mui/material";
import { useRouter } from "next/router";
import API from "../../../api/api";
import { Page } from "../../../components/infinite/infinite-scroll";
import InfiniteSongView from "../../../components/infinite/infinite-song-view";
import { SongSortingKeys, SongWithArtist } from "../../../models/song";
import getSlugOrId from "../../../utils/getSlugOrId";
import { SortingParameters } from "../../../utils/sorting";
import ArtistRelationPageHeader from "../../../components/relation-page-header/artist-relation-page-header";
import prepareSSR, { InferSSRProps } from "../../../ssr";

const artistSongsQuery = (
	artistSlugOrId: number | string, sort?: SortingParameters<typeof SongSortingKeys>
) => ({
	key: [
		"artist",
		artistSlugOrId,
		"songs",
		sort ?? {}
	],
	exec: (lastPage: Page<SongWithArtist>) => API.getArtistSongs<SongWithArtist>(artistSlugOrId, lastPage, sort, ['artist'])
});

export const getServerSideProps = prepareSSR((context) => {
	const artistIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { artistIdentifier },
		infiniteQueries: [artistSongsQuery(artistIdentifier)]
	};
});

const ArtistAlbumsPage = (
	{ artistIdentifier }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	artistIdentifier ??= getSlugOrId(router.query);
	return <Box sx={{ width: '100%' }}>
		<ArtistRelationPageHeader artistSlugOrId={artistIdentifier}/>
		<InfiniteSongView
			query={(sort) => artistSongsQuery(artistIdentifier, sort)}
		/>
	</Box>;
};

export default ArtistAlbumsPage;
